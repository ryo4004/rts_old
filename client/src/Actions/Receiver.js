import socketio from 'socket.io-client'

const prefix = 'RECEIVER_'

let peerConnection
let dataChannel

// 受信データ一時置き場
let chunks = []
let receivedDataCount = 0

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

export const connectSocket = (senderID) => {
  return async (dispatch, getState) => {
    dispatch(loading(true))
    dispatch(setSenderID(senderID))
    // Socket接続
    const socket = await socketio.connect('https://192.168.1.254:3000/', {secure: true})
    // const socket = socketio.connect('https://cast.winds-n.com, {secure: true})
    socket.on('connect', () => {
      dispatch(setSocket(socket))
    })
    // connection_complete で自分のIDを取得
    socket.on('connection_complete', async (obj) => {
      dispatch(loading(false))
      dispatch(setSelfID(obj.id))
      // senderにRequestを送る
      socket.emit('request_to_sender', {
        from: obj.id,
        to: senderID
      })
      
      // PeerConnection作成
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
        iceTransportPolicy: 'all'
      })
      dataChannel = peerConnection.createDataChannel(
        'label',
        {
          ordered: true
        }
      )
      dataChannel.onopen = () => {
        dispatch(dataChannelOpenStatus(true))
        console.warn('DataChannel Standby')
      }

      // 受信データ形式を明示(ブラウザ間差異のため)
      dataChannel.binaryType = 'arraybuffer'

      console.warn('label', dataChannel.label)
      console.warn('ordered', dataChannel.ordered)
      console.warn('protocol', dataChannel.protocol)
      console.warn('id', dataChannel.id)
      console.warn('readyState', dataChannel.readyState)
      console.warn('bufferedAmount', dataChannel.bufferedAmount)
      console.warn('binaryType', dataChannel.binaryType)
      console.warn('maxPacketLifeType', dataChannel.maxPacketLifeType)
      console.warn('maxRetransmits', dataChannel.maxRetransmits)
      console.warn('negotiated', dataChannel.negotiated)
      console.warn('reliable', dataChannel.reliable)
      console.warn('stream', dataChannel.stream)

      // 受信時の処理
      dataChannel.onmessage = (event) => {
        // console.log('DataChannel受信', event)
        if (typeof(event.data) === 'string') {
          console.log('受信データ情報', JSON.parse(event.data))
          return dispatch(setReceivedDataInfo(JSON.parse(event.data)))
        }
        let receivedData = new Uint8Array(event.data)
        chunks.push(receivedData)
        dispatch(setReceivedDataCount(++receivedDataCount))
        console.log('データ受信中', dataChannel.readyState, dataChannel.bufferedAmount)
        if (receivedData[0] === 0) return 
        console.log('データ受信完了', receivedData, getState().receiver.receivedDataCount, getState().receiver.receivedDataInfo.size.sendTotal)

        if (getState().receiver.receivedDataCount === getState().receiver.receivedDataInfo.size.sendTotal) {
          console.log('送信回数一致')
        }

        // const reducer = (accumulator, currentValue) => accumulator + currentValue;
        console.log('chunks', chunks)
        let length = chunks.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.byteLength - 1
        }, 0)
        console.log('length', length)
        let data = new Uint8Array(length)
        let pos = 0
        chunks.forEach((chunk) => {
          data.set(chunk.slice(1), pos)
          pos += chunk.length - 1
        })
        console.log('受信したファイル', data)
        // const fileBlob = new Blob(data, {type: getState().receiver.receivedDataInfo.file.type})
        // console.warn('fileBlob', fileBlob)
        // let file = new File(data, getState().receiver.receivedDataInfo.file.name, {
        //   type: getState().receiver.receivedDataInfo.file.type,
        //   lastModified: getState().receiver.receivedDataInfo.file.lastModified
        // })
        // console.log(file)

        // // var blob = new Blob(audioChunks, {mimeType: 'audio/webm;codecs=opus'})
        // // const blobUrl = window.URL.createObjectURL(blob)
        // // this.download.download = 'recorder_' + startTime + '.webm'
        // // this.download.href = blobUrl
        // // this.download.click()
        // // console.log('ダウンロード: ' + 'recorder_' + startTime + '.webm')
        // const fileUrl = window.URL.createObjectURL(file)

        // dispatch(setReceivedFileUrl(fileUrl))

        // 受信データ一時置き場をリセットする
        chunks = []
        receivedDataCount = 0
      }
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.warn('経路発見')
          socket.emit('send_found_candidate', {
            selfType: 'Receiver',
            to: senderID,
            from: obj.id,
            candidate: event.candidate
          })
        } else {
          // event.candidateが空の場合は終了
        }
      }
      let offerSdp = await peerConnection.createOffer()
      console.warn('offerSdp', offerSdp)
      await peerConnection.setLocalDescription(offerSdp)
  
      // senderにRequestを送る
      socket.emit('send_offer_sdp', {
        to: senderID,
        type: 'offer',
        sdp: offerSdp
      })
    })
    // 受信
    socket.on('send_answer_sdp', async (obj) => {
      console.warn('AnserSDP', obj)    
      await peerConnection.setRemoteDescription(new RTCSessionDescription(obj.sdp))
    })
    // 受信
    socket.on('send_found_candidate', async (obj) => {
      console.warn('経路受信')
      await peerConnection.addIceCandidate(new RTCIceCandidate(obj.candidate))
    })
    dispatch(setSocket(socket))
  }
}

const setSocket = (socket) => ({
  type: prefix + 'SET_SOCKET',
  payload: { socket }
})

const setSelfID = (selfID) => ({
  type: prefix + 'SET_SELF_ID',
  payload: { selfID }
})

const setSenderID = (senderID) => ({
  type: prefix + 'SET_SENDER_ID',
  payload: { senderID }
})

const dataChannelOpenStatus = (dataChannelOpenStatus) => ({
  type: prefix + 'DATACHANNEL_OPEN_STATUS',
  payload: { dataChannelOpenStatus }
})

const setReceivedDataInfo = (receivedDataInfo) => ({
  type: prefix + 'SET_RECEIVED_DATA_INFO',
  payload: { receivedDataInfo }
})

const setReceivedDataCount = (receivedDataCount) => ({
  type: prefix + 'SET_RECEIVED_DATA_COUNT',
  payload: { receivedDataCount }
})

const setReceivedFileUrl = (receivedFileUrl) => ({
  type: prefix + 'SET_RECEIVED_FILE_URL',
  payload: { receivedFileUrl }
})
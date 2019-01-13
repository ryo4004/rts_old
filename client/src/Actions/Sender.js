import socketio from 'socket.io-client'

const prefix = 'SENDER_'

let peerConnection
let dataChannel

let chunkSize = 1024 * 16 - 1
let start = 0
let sentDataCount = 0

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

export const setFileList = (fileList) => ({
  type: prefix + 'SET_FILELIST',
  payload: { fileList }
})

export const connectSocket = () => {
  return async (dispatch, getState) => {
    dispatch(loading(true))
    // Socket接続
    const socket = await socketio.connect('https://192.168.1.254:3000/', {secure: true})
    // const socket = socketio.connect('https://cast.winds-n.com, {secure: true})
    socket.on('connect', () => {
      dispatch(setSocket(socket))
    })
    // 受信 connection_complete で自分のIDを取得
    socket.on('connection_complete', (obj) => {
      dispatch(loading(false))
      dispatch(setSelfID(obj.id))
    })
    // 受信 Receiver情報を取得
    socket.on('request_to_sender', (obj) => {
      console.warn('Receiver id', obj)
      dispatch(setReceiverID(obj.from))
    })
    // 受信
    socket.on('send_offer_sdp', async (obj) => {
      console.warn('OfferSdp', obj)

      // PeerConnection作成
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
        iceTransportPolicy: 'all'
      })
      peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel
        dataChannel.onopen = () => {
          dispatch(dataChannelOpenStatus(true))
          console.warn('DataChannel Standby')
        }
        dataChannel.onmessage = (event) => { console.log('DataChannel受信', event) }
      }
      peerConnection.oniceconnectionstatechange = (event) => { console.log('oniceconnectionstatechange', event) }
      peerConnection.onicegatheringstatechange = (event) => { console.log('onicegatheringstatechange', event) }
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.warn('経路発見')
          getState().sender.socket.emit('send_found_candidate', {
            selfType: 'Sender',
            to: getState().sender.receiverID,
            from: getState().sender.selfID,
            candidate: event.candidate
          })
        } else {
          // event.candidateが空の場合は終了
        }
      }
      await peerConnection.setRemoteDescription(new RTCSessionDescription(obj.sdp))
      let answerSdp = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answerSdp)
      socket.emit('send_answer_sdp', {
        to: getState().sender.receiverID,
        type: 'answer',
        sdp: answerSdp
      })
    })
    socket.on('send_found_candidate', async (obj) => {
      console.warn('経路受信')
      await peerConnection.addIceCandidate(new RTCIceCandidate(obj.candidate))
    })
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

const setReceiverID = (receiverID) => ({
  type: prefix + 'SET_RECEIVER_ID',
  payload: { receiverID }
})

const dataChannelOpenStatus = (dataChannelOpenStatus) => ({
  type: prefix + 'DATACHANNEL_OPEN_STATUS',
  payload: dataChannelOpenStatus
})

export const sendData = () => {
  return async () => {
    console.log('DataChannel送信')
    dataChannel.send('文字列')
  }
}

export const sendFile = () => {
  return async (dispatch, getState) => {
    console.log('sendFile')
    let fileReader = new FileReader()
    fileReader.onloadstart = (event) => { console.log('fileReader onloadstart', event) }
    fileReader.onabort = (event) => { console.log('fileReader onabort', event) }
    fileReader.onerror = (event) => { console.log('fileReader onerror', event) }
    fileReader.onloadend = (event) => { console.log('fileReader onloadend', event) }
    fileReader.onprogress = (event) => { console.log('fileReader onprogress', event.loaded + '/' + event.total) }
    fileReader.onload = (event) => {
      console.warn('DataChannelファイル送信開始', getState().sender.fileList[0])
      let data = new Uint8Array(event.target.result)
      console.log('バイト数: ' + data.byteLength, '送信回数: ' + Math.ceil(data.byteLength / chunkSize), '余り: ' + (data.byteLength % chunkSize))
      console.warn('sendData', data)
      const sendInfo = {
        size: {
          total: data.byteLength,
          sendTotal: Math.ceil(data.byteLength / chunkSize),
          lastSize: data.byteLength % chunkSize,
        },
        file: {
          lastModified: getState().sender.fileList[0].lastModified,
          name: getState().sender.fileList[0].name,
          size: getState().sender.fileList[0].size,
          type: getState().sender.fileList[0].type,
          webkitRelativePath: getState().sender.fileList[0].webkitRelativePath
        }
      }
      
      // console.warn('blob', data)
      // const fileBlob = new Blob(data, {type: sendInfo.file.type})
      // console.warn('fileBlob', fileBlob)

      // console.warn('file')
      // let file = new File(data, sendInfo.file.name)//, {
      // //   type: sendInfo.file.type,
      // //   lastModified: sendInfo.file.lastModified
      // // })
      // console.warn('file', file)

      dispatch(setSentDataInfo(sendInfo))
      dataChannel.send(JSON.stringify(sendInfo))
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

      const userAgent = window.navigator.userAgent.toLowerCase()
      if(userAgent.indexOf('msie') != -1 || userAgent.indexOf('trident') != -1) {
        // Internet Explorer
      } else if(userAgent.indexOf('edge') != -1) {
        // Edge
      } else if(userAgent.indexOf('chrome') != -1) {
        // Google Chrome
        while (start < data.byteLength) {
          if (dataChannel.bufferedAmount === 0) {
          // if (dataChannel.bufferedAmount < 10000000) {
            let end = start + chunkSize
            let chunkData = data.slice(start, end)
            let chunk = new Uint8Array(chunkData.byteLength + 1)
            chunk[0] = (end >= data.byteLength ? 1 : 0 )
            chunk.set(new Uint8Array(chunkData), 1)
            console.log('Chrome DataChannelファイル送信中', dataChannel.bufferedAmount)
            // console.log('DataChannelファイル送信')
            dataChannel.send(chunk)
            start = end
            // dispatch(setSentDataCount(++sentDataCount))
          }
        }
      } else if(userAgent.indexOf('safari') != -1) {
        // Safari
      } else if(userAgent.indexOf('firefox') != -1) {
        // FireFox
        while (start < data.byteLength) {
          let end = start + chunkSize
          let chunkData = data.slice(start, end)
          let chunk = new Uint8Array(chunkData.byteLength + 1)
          chunk[0] = (end >= data.byteLength ? 1 : 0 )
          chunk.set(new Uint8Array(chunkData), 1)
          console.log('Firefox DataChannelファイル送信中')
          // console.log('DataChannelファイル送信')
          dataChannel.send(chunk)
          start = end
          // dispatch(setSentDataCount(++sentDataCount))
        }
      } else if(userAgent.indexOf('opera') != -1) {
        // Opera
      } else {
        // undefined
      }

      console.log('DataChannelファイル送信完了')
      // 送信処理リセット
      start = 0
      sentDataCount = 0
    }
    fileReader.readAsArrayBuffer(getState().sender.fileList[0])
  }
}

const setSentDataInfo = (sentDataInfo) => ({
  type: prefix + 'SET_SENT_DATA_INFO',
  payload: { sentDataInfo }
})

const setSentDataCount = (sentDataCount) => ({
  type: prefix + 'SET_SENT_DATA_COUNT',
  payload: { sentDataCount }
})

import socketio from 'socket.io-client'

const prefix = 'RECEIVER_'

let peerConnection
let dataChannel

// 受信データ一時置き場
let packets = []
let receivePacketCount = 0

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
      // senderにRequestを送る(IDを通知)
      socket.emit('request_to_sender', {
        from: obj.id,
        to: senderID
      })

      // peerConnectionを作成
      connectPeerConnection(socket, obj, dispatch, getState)

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

async function connectPeerConnection (socket, obj, dispatch, getState) {
  const senderID = getState().receiver.senderID
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
    dataReceive(event, dispatch, getState)
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
}

const setReceiveFileList = (receiveFileList) => ({
  type: prefix + 'SET_RECEIVE_FILE_LIST',
  payload: { receiveFileList }
})

function updateReceiveFileList (id, property, value, dispatch, getState) {
  // JSON.parse(JSON.stringify())は使わない
  const receiveFileList = {}
  Object.assign(receiveFileList, getState().receiver.receiveFileList)
  receiveFileList[id][property] = value
  dispatch(setReceiveFileList(receiveFileList))
}

function updateReceiveFileInfo (property, value, dispatch, getState) {
  // JSON.parse(JSON.stringify())は使わない
  const receiveFileList = {}
  Object.assign(receiveFileList, getState().sender.receiveFileList)
  receiveFileList[id][property] = value
  dispatch(setReceiveFileList(receiveFileList))
}

function dataReceive (event, dispatch, getState) {
  // console.log('DataChannel受信', event)
  if (typeof(event.data) === 'string') {
    // オブジェクトのプロパティによって処理判定
    if (JSON.parse(event.data).add !== undefined) {
      // addプロパティを外す
      const receiveFileList = JSON.parse(event.data).add
      console.log('受信リストに追加', receiveFileList)
      Object.assign(receiveFileList, getState().receiver.receiveFileList)
      return dispatch(setReceiveFileList(receiveFileList))
    } else if (JSON.parse(event.data).sendFileInfo !== undefined) {
      // sendFileInfoプロパティを外す
      const receiveData = JSON.parse(event.data).sendFileInfo
      console.log('受信処理開始', receiveData)
      // receiveFileInfoは上書き
      return dispatch(setReceiveFileInfo(receiveData))
    }
  }
  let receivedData = new Uint8Array(event.data)
  packets.push(receivedData)
  const receiveFileInfo = getState().receiver.receiveFileInfo
  updateReceiveFileList(receiveFileInfo.id, 'receive', Math.ceil(receivePacketCount / receiveFileInfo.size.sendTime * 1000.0) / 10.0, dispatch, getState)
  console.log('データ受信中')
  receivePacketCount++

  if (receivedData[0] === 0) return
  console.warn(getState().receiver.receiveFileInfo, getState().receiver.receiveFileInfo.size)
  console.log('データ受信完了', receivedData, getState().receiver.receivePacketCount, getState().receiver.receiveFileInfo.size.sendTime)
  updateReceiveFileList(receiveFileInfo.id, 'receive', 100, dispatch, getState)


  if (getState().receiver.receivePacketCount === getState().receiver.receiveFileInfo.size.sendTime) {
    console.log('送信回数一致')
  }

  // const reducer = (accumulator, currentValue) => accumulator + currentValue
  let length = packets.reduce((accumulator, currentValue) => {
    return accumulator + currentValue.byteLength - 1
  }, 0)
  console.log('length', length)
  let data = new Uint8Array(length)
  let pos = 0
  packets.forEach((packet) => {
    data.set(packet.slice(1), pos)
    pos += packet.length - 1
  })
  console.log('受信したファイル', data, getState().receiver.receiveFileInfo.file.name)

  // const blob = new Blob([data], {type: getState().receiver.receiveFileInfo.file.type})
  // const url = window.URL.createObjectURL(blob)

  const file = new File([data], getState().receiver.receiveFileInfo.file.name, {
    type: getState().receiver.receiveFileInfo.file.type,
    lastModified: getState().receiver.receiveFileInfo.file.lastModified
  })
  console.log(file)

  // const url = window.URL.createObjectURL(file)

  // dispatch(setReceivedFileUrl(url))

  const id = getState().receiver.receiveFileInfo.id
  const receiveFileUrlList = {
    [id]: window.URL.createObjectURL(file)
  }
  Object.assign(receiveFileUrlList, getState().receiver.receiveFileUrlList)
  dispatch(setReceiveFileUrlList(receiveFileUrlList))

  // 受信データ一時置き場をリセットする
  packets = []
  receivePacketCount = 0
  dispatch(setReceiveFileInfo(undefined))
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

// 受信処理中のファイル情報
const setReceiveFileInfo = (receiveFileInfo) => ({
  type: prefix + 'SET_RECEIVE_FILE_INFO',
  payload: { receiveFileInfo }
})

// const setReceivePacketCount = (receivePacketCount) => ({
//   type: prefix + 'SET_RECEIVE_PACKET_COUNT',
//   payload: { receivePacketCount }
// })

const setReceiveFileUrlList = (receiveFileUrlList) => ({
  type: prefix + 'SET_RECEIVE_FILE_URL_LIST',
  payload: { receiveFileUrlList }
})

const setReceivedFileUrl = (receivedFileUrl) => ({
  type: prefix + 'SET_RECEIVED_FILE_URL',
  payload: { receivedFileUrl }
})
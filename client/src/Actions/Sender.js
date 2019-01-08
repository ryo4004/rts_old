import socketio from 'socket.io-client'

const prefix = 'SENDER_'

let pc
let dc

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
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
    // 受信 Reciever情報を取得
    socket.on('request_to_sender', (obj) => {
      console.warn('Reciever id', obj)
      dispatch(setRecieverID(obj.from))
    })
    // 受信
    socket.on('send_offer_sdp', async (obj) => {
      console.warn('OfferSdp', obj)

      // PeerConnection作成
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
        iceTransportPolicy: 'all'
      })
      pc.ondatachannel = (event) => {
        dc = event.channel
        dc.onopen = () => { console.warn('DataChannel使用可能') }
        dc.onmessage = (event) => { console.log('DataChannel受信', event) }
      }
      pc.onicecandidate = (event) => {
        console.warn('経路発見')
        if (event.candidate) {
          getState().sender.socket.emit('send_found_candidate', {
            to: getState().sender.recieverID,
            from: getState().sender.selfID,
            candidate: event.candidate
          })
        } else {
          // event.candidateが空の場合は終了
        }
      }
      await pc.setRemoteDescription(new RTCSessionDescription(obj.sdp))
      let answerSdp = await pc.createAnswer()
      await pc.setLocalDescription(answerSdp)
      socket.emit('send_answer_sdp', {
        to: getState().sender.recieverID,
        type: 'answer',
        sdp: answerSdp
      })
    })
    socket.on('send_found_candidate', async (obj) => {
      console.warn('経路受信')
      await pc.addIceCandidate(new RTCIceCandidate(obj.candidate))
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

const setRecieverID = (recieverID) => ({
  type: prefix + 'SET_RECIEVER_ID',
  payload: { recieverID }
})

export const sendData = () => {
  return async () => {
    console.log('DataChannel送信')
    dc.send('文字列')
  }
}
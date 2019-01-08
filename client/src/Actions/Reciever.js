import socketio from 'socket.io-client'

const prefix = 'RECIEVER_'

let pc
let dc

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

export const connectSocket = (senderID) => {
  return async (dispatch) => {
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
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
        iceTransportPolicy: 'all'
      })
      dc = pc.createDataChannel(
        'label',
        {
          ordered: true
        }
      )
      dc.onopen = () => { console.warn('DataChannel使用可能') }
      dc.onmessage = (event) => { console.log('DataChannel受信', event) }
      pc.onicecandidate = (event) => {
        console.warn('経路発見')
        if (event.candidate) {
          socket.emit('send_found_candidate', {
            to: senderID,
            from: obj.id,
            candidate: event.candidate
          })
        } else {
          // event.candidateが空の場合は終了
        }
      }
      let offerSdp = await pc.createOffer()
      console.warn('offerSdp', offerSdp)
      await pc.setLocalDescription(offerSdp)
  
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
      await pc.setRemoteDescription(new RTCSessionDescription(obj.sdp))
    })
    // 受信
    socket.on('send_found_candidate', async (obj) => {
      console.warn('経路受信')
      await pc.addIceCandidate(new RTCIceCandidate(obj.candidate))
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

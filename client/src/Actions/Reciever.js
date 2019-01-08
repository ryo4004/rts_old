import socketio from 'socket.io-client'

const prefix = 'RECIEVER_'

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

const setSenderID = (senderID) => ({
  type: prefix + 'SET_SENDER_ID',
  payload: { senderID }
})

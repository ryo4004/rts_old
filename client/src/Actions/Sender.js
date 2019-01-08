import socketio from 'socket.io-client'

const prefix = 'SENDER_'

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

export const connectSocket = () => {
  return async (dispatch) => {
    dispatch(loading(true))
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
    })
    // Reciever情報を取得
    socket.on('request_to_sender', async (obj) => {
      console.warn('Reciever id', obj)
      dispatch(setRecieverID(obj.from))
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

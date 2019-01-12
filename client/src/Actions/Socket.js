// import socketio from 'socket.io-client'

// const prefix = 'SOCKET_'

// const loading = (loading) => ({
//   type: prefix + 'LOADING',
//   payload: { loading }
// })

// export const connectSocket = (otherid) => {
//   return async (dispatch) => {
//     otherid ? dispatch(setOtherID(otherid)) : false
//     dispatch(loading(true))
//     // Socket接続
//     const socket = await socketio.connect('https://192.168.1.254:3000/', {secure: true})
//     // const socket = socketio.connect('https://cast.winds-n.com, {secure: true})
//     socket.on('connect', () => {

//       if (otherid) {
//         socket.emit('request_id', {
//           requestid: otherid
//         })  
//       }
//       console.warn('socket connected', socket)
//       dispatch(setSocket(socket))
//       dispatch(loading(false))
//     })
//     socket.on('connection_complete', async (obj) => {
//       console.warn('id receive', obj)
//       dispatch(setSelfID(obj.id))
//     })
//   }
// }

// const setSocket = (socket) => ({
//   type: prefix + 'SET_SOCKET',
//   payload: { socket }
// })

// const setSelfID = (selfid) => ({
//   type: prefix + 'SET_SELF_ID',
//   payload: { selfid }
// })

// const setOtherID = (otherid) => ({
//   type: prefix + 'SET_OTHER_ID',
//   payload: { otherid }
// })

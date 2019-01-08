// const initialState = {
//   loading: false,
//   socket: undefined,
//   selfid: undefined,
//   otherid: undefined
// }

// const prefix = 'SOCKET_'

// export default function socketReducer (state = initialState, action) {
//   switch (action.type) {
//     case prefix + 'LOADING':
//       return {
//         ...state,
//         loading: action.payload.loading
//       }
//     case prefix + 'SET_SOCKET':
//       return {
//         ...state,
//         socket: action.payload.socket
//       }
//     case prefix + 'SET_SELF_ID':
//       return {
//         ...state,
//         selfid: action.payload.selfid
//       }
//     case prefix + 'SET_OTHER_ID':
//       return {
//         ...state,
//         otherid: action.payload.otherid
//       }
//     default:
//       return state
//   }
// }
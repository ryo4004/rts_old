const initialState = {
  loading: false,
  socket: undefined,
  selfID: undefined,
  senderID: undefined
}

const prefix = 'RECIEVER_'

export default function recieverReducer (state = initialState, action) {
  switch (action.type) {
    case prefix + 'LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
    case prefix + 'SET_SOCKET':
      return {
        ...state,
        socket: action.payload.socket
      }
    case prefix + 'SET_SELF_ID':
      return {
        ...state,
        selfID: action.payload.selfID
      }
    case prefix + 'SET_SENDER_ID':
      return {
        ...state,
        senderID: action.payload.senderID
      }
    default:
      return state
  }
}
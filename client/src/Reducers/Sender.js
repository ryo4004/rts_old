const initialState = {
  loading: false,
  socket: undefined,
  selfID: undefined,
  recieverID: undefined
}

const prefix = 'SENDER_'

export default function senderReducer (state = initialState, action) {
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
    case prefix + 'SET_RECIEVER_ID':
      return {
        ...state,
        recieverID: action.payload.recieverID
      }
    default:
      return state
  }
}
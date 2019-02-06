const initialState = {
  loading: false,

  socket: undefined,
  selfSocketID: undefined,
  senderSocketID: undefined,
  receiverSocketID: undefined,

  dataChannelOpenStatus: false,
}

const prefix = 'CONNECTION_'

export default function connectionReducer (state = initialState, action) {
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
    case prefix + 'SET_SELF_SOCKET_ID':
      return {
        ...state,
        selfSocketID: action.payload.selfSocketID
      }
    case prefix + 'SET_SENDER_SOCKET_ID':
      return {
        ...state,
        senderSocketID: action.payload.senderSocketID
      }
    case prefix + 'SET_RECEIVER_SOCKET_ID':
      return {
        ...state,
        receiverSocketID: action.payload.receiverSocketID
      }
    case prefix + 'DATACHANNEL_OPEN_STATUS':
      return {
        ...state,
        dataChannelOpenStatus: action.payload.dataChannelOpenStatus
      }
    default:
      return state
  }
}
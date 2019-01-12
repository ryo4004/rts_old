const initialState = {
  loading: false,
  socket: undefined,
  selfID: undefined,
  senderID: undefined,
  dataChannelOpenStatus: false,
  receivedDataInfo: undefined,
  receivedDataCount: 0,
  receivedFileUrl: undefined,
}

const prefix = 'RECEIVER_'

export default function receiverReducer (state = initialState, action) {
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
    case prefix + 'DATACHANNEL_OPEN_STATUS':
      return {
        ...state,
        dataChannelOpenStatus: action.payload.dataChannelOpenStatus
      }
    case prefix + 'SET_RECEIVED_DATA_INFO':
      return {
        ...state,
        receivedDataInfo: action.payload.receivedDataInfo
      }
    case prefix + 'SET_RECEIVED_DATA_COUNT':
      return {
        ...state,
        receivedDataCount: action.payload.receivedDataCount
      }
    case prefix + 'SET_RECEIVED_FILE_URL':
      return {
        ...state,
        receivedFileUrl: action.payload.receivedFileUrl
      }
    default:
      return state
  }
}
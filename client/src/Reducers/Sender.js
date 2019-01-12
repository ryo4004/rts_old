const initialState = {
  loading: false,
  fileList: undefined,
  socket: undefined,
  selfID: undefined,
  receiverID: undefined,
  dataChannelOpenStatus: false,
  sentDataInfo: undefined,
  sentDataCount: 0,
}

const prefix = 'SENDER_'

export default function senderReducer (state = initialState, action) {
  switch (action.type) {
    case prefix + 'LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
    case prefix + 'SET_FILELIST':
      return {
        ...state,
        fileList: action.payload.fileList
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
    case prefix + 'SET_RECEIVER_ID':
      return {
        ...state,
        receiverID: action.payload.receiverID
      }
    case prefix + 'DATACHANNEL_OPEN_STATUS':
      return {
        ...state,
        dataChannelOpenStatus: action.payload.dataChannelOpenStatus
      }
    case prefix + 'SET_SENT_DATA_INFO':
      return {
        ...state,
        sentDataInfo: action.payload.sentDataInfo
      }
    case prefix + 'SET_SENT_DATA_COUNT':
      return {
        ...state,
        sentDataCount: action.payload.sentDataCount
      }
    default:
      return state
  }
}
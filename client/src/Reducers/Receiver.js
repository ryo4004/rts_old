const initialState = {
  loading: false,
  socket: undefined,
  selfID: undefined,
  senderID: undefined,
  dataChannelOpenStatus: false,

  // 追加されたファイルと状態の管理
  receiveFileList: {},
  // ファイル実置き場
  receiveFileStorage: {},

  // 受信処理中のファイル情報
  receiveFileInfo: undefined,
  receivePacketCount: 0,
  receiveFileUrlList: {},
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
    case prefix + 'SET_RECEIVE_FILE_LIST':
      return {
        ...state,
        receiveFileList: action.payload.receiveFileList
      }
    case prefix + 'SET_RECEIVE_FILE_STORAGE':
      return {
        ...state,
        receiveFileStorage: action.payload.receiveFileStorage
      }
    case prefix + 'SET_RECEIVE_FILE_INFO':
      return {
        ...state,
        receiveFileInfo: action.payload.receiveFileInfo
      }
    case prefix + 'SET_RECEIVE_PACKET_COUNT':
      return {
        ...state,
        receivePacketCount: action.payload.receivePacketCount
      }
    case prefix + 'SET_RECEIVE_FILE_URL_LIST':
      return {
        ...state,
        receiveFileUrlList: action.payload.receiveFileUrlList
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
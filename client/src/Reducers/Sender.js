const initialState = {
  loading: false,

  // input[type=file]の状態
  fileList: {},
  // 追加されたファイルと状態の管理
  sendFileList: {},
  // // ファイル実置き場
  // sendFileStorage: {},

  socket: undefined,
  selfID: undefined,
  receiverID: undefined,
  dataChannelOpenStatus: false,
  // 送信処理中のファイルの情報
  sendFileInfo: undefined,
  // 
  sendPacketCount: 0,
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
    case prefix + 'SET_SEND_FILE_LIST':
      return {
        ...state,
        sendFileList: action.payload.sendFileList
      }
    // case prefix + 'SET_SEND_FILE_STORAGE':
    //   return {
    //     ...state,
    //     sendFileStorage: action.payload.sendFileStorage
    //   }
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
    case prefix + 'SET_SEND_FILE_INFO':
      return {
        ...state,
        sendFileInfo: action.payload.sendFileInfo
      }
    case prefix + 'SET_SEND_PACKET_COUNT':
      return {
        ...state,
        sendPacketCount: action.payload.sendPacketCount
      }
    default:
      return state
  }
}
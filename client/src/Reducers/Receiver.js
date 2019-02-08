const initialState = {
  loading: false,

  // 追加されたファイルと状態の管理
  receiveFileList: {},
  // ファイル一時置き場
  receiveFileStorage: {},

  // ファイルURLリスト
  receiveFileUrlList: {},
  // receivedFileUrl: undefined,

  errorState: undefined,
  errorText: undefined,
}

const prefix = 'RECEIVER_'

export default function receiverReducer (state = initialState, action) {
  switch (action.type) {
    case prefix + 'LOADING':
      return {
        ...state,
        loading: action.payload.loading
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
    case prefix + 'SET_RECEIVE_FILE_URL_LIST':
      return {
        ...state,
        receiveFileUrlList: action.payload.receiveFileUrlList
      }
    case prefix + 'SET_RECEIVE_ERROR':
      return {
        ...state,
        errorState: action.payload.errorState,
        errorText: action.payload.errorText
      }
    default:
      return state
  }
}
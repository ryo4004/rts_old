const initialState = {
  loading: false,

  // 追加されたファイルと状態の管理
  sendFileList: {}
}

const prefix = 'SENDER_'

export default function senderReducer (state = initialState, action) {
  switch (action.type) {
    case prefix + 'LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
    case prefix + 'SET_SEND_FILE_LIST':
      return {
        ...state,
        sendFileList: action.payload.sendFileList
      }
    default:
      return state
  }
}
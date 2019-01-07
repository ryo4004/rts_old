const initialState = {
  loading: false,
  width: 0,
  pc: true,
  mobile: false,

  fileAPI: undefined,
  socket: undefined,
  id: undefined,
  available: undefined,
}

export default function statusReducer (state = initialState, action) {
  switch (action.type) {
    case 'STATUS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
    case 'STATUS_WINDOW_WIDTH':
      return {
        ...state,
        width: action.payload.width,
        pc: action.payload.pc,
        mobile: action.payload.mobile
      }
    case 'STATUS_SET_FILE_API':
      return {
        ...state,
        fileAPI: action.payload.fileAPI
      }
    case 'STATUS_SET_SOCKET':
      return {
        ...state,
        socket: action.payload.socket
      }
    case 'STATUS_SET_ID':
      return {
        ...state,
        id: action.payload.id
      }
    case 'STATUS_SET_AVAILABLE':
      return {
        ...state,
        available: action.payload.available
      }
    default:
      return state
  }
}
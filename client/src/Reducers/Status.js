const initialState = {
  loading: false,
  width: 0,
  pc: true,
  mobile: false,

  fileAPI: undefined,
  available: undefined,
}

const prefix = 'STATUS_'

export default function statusReducer (state = initialState, action) {
  switch (action.type) {
    case prefix + 'LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
    case prefix + 'WINDOW_WIDTH':
      return {
        ...state,
        width: action.payload.width,
        pc: action.payload.pc,
        mobile: action.payload.mobile
      }
    case prefix + 'SET_FILE_API':
      return {
        ...state,
        fileAPI: action.payload.fileAPI
      }
    case prefix + 'SET_AVAILABLE':
      return {
        ...state,
        available: action.payload.available
      }
    default:
      return state
  }
}
const initialState = {
  loading: false,
  width: 0,
  pc: true,
  mobile: false,
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
    default:
      return state
  }
}
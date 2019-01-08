const initialState = {
  loading: false,
  guestID: undefined
}

const prefix = 'SENDER_'

export default function senderReducer (state = initialState, action) {
  switch (action.type) {
    case prefix + 'LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
    case prefix + 'SET_GUEST_ID':
      return {
        ...state,
        guestID: action.payload.guestID
      }
    default:
      return state
  }
}
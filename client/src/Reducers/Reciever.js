const initialState = {
  loading: false,
  requestID: undefined
}

const prefix = 'RECIEVER_'

export default function recieverReducer (state = initialState, action) {
  switch (action.type) {
    case prefix + 'LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
    case prefix + 'SET_REQUEST_ID':
      return {
        ...state,
        requestID: action.payload.requestID
      }
    default:
      return state
  }
}
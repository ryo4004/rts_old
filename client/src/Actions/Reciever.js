const prefix = 'RECIEVER_'

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

const setRequestID = (requestID) => ({
  type: prefix + 'SET_REQUEST_ID',
  payload: { requestID }
})
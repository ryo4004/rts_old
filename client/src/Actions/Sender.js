const prefix = 'SENDER_'

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

const setGuestID = (guestID) => ({
  type: prefix + 'SET_GUEST_ID',
  payload: { guestID }
})
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import statusReducer from '../Reducers/Status'
// import socketReducer from '../Reducers/Socket'
import connectionReducer from '../Reducers/Connection'
import senderReducer from '../Reducers/Sender'
import receiverReducer from '../Reducers/Receiver'
// import toastReducer from '../Reducers/Toast'

// historyはsrc/App.jsから渡す
export default function createRootReducer(history) {
  return combineReducers({
    status: statusReducer,
    // socket: socketReducer,
    connection: connectionReducer,
    sender: senderReducer,
    receiver: receiverReducer,
    // toast: toastReducer,

    // connected-react-routerのReducer
    router: connectRouter(history),
    // history: historyReducer
  })
}

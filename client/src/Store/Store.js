import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import statusReducer from '../Reducers/Status'
import socketReducer from '../Reducers/Socket'
import senderReducer from '../Reducers/Sender'
import recieverReducer from '../Reducers/Reciever'
// import toastReducer from '../Reducers/Toast'

// historyはsrc/App.jsから渡す
export default function createRootReducer(history) {
  return combineReducers({
    status: statusReducer,
    socket: socketReducer,
    sender: senderReducer,
    reciever: recieverReducer,
    // toast: toastReducer,

    // connected-react-routerのReducer
    router: connectRouter(history),
    // history: historyReducer
  })
}

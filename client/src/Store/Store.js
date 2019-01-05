import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import statusReducer from '../Reducers/Status'

// import toastReducer from '../Reducers/Toast'

// historyはsrc/App.jsから渡す
export default function createRootReducer(history) {
  return combineReducers({
    status: statusReducer,
    // toast: toastReducer,

    // connected-react-routerのReducer
    router: connectRouter(history),
    // history: historyReducer
  })
}

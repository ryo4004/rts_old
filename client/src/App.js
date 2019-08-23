import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'
import { applyMiddleware, compose, createStore } from 'redux'
import { Provider } from 'react-redux'
import { createBrowserHistory } from 'history'
import createRootReducer from './Store/Store'
import logger from 'redux-logger'
import thunk from 'redux-thunk'

import Main from './Component/Main/Main'
import { routerMiddleware, ConnectedRouter } from 'connected-react-router';

const history = createBrowserHistory()
const store = createStore(
  createRootReducer(history),
  compose(
    applyMiddleware(
      routerMiddleware(history),
      // logger,
      thunk
    )
  )
)

history.listen((location) => {
  // console.log('location change', location)
  window.localStorage.setItem('location', location.pathname)
})

export default class App extends Component {
  render () {
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Switch>
            <Route path='/' component={Main} />
          </Switch>
        </ConnectedRouter>
      </Provider>
    )
  }
}
import { replace } from 'connected-react-router'
import { divisionWidth } from '../Library/Library'
import socketio from 'socket.io-client'

export const setLocation = (location) => {
  return async (dispatch) => {
    // dispatch(replace(location))
  }
}

export const windowWidthChange = () => {
  return (dispatch) => {
    const width = window.innerWidth
    const pc = width > divisionWidth ? true : false
    const mobile = !pc
    dispatch(setWidth(width, pc, mobile))
  }
}

export const setWidth = (width, pc, mobile) => ({
  type: 'STATUS_WINDOW_WIDTH',
  payload: {
    width,
    pc,
    mobile
  }
})

export const prepare = () => {
  return async (dispatch) => {
    dispatch(loading(true))
    dispatch(setAvailable(false))
    let fileAPI = false
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      dispatch(setFileAPI(true))
      fileAPI = true
    } else {
      dispatch(setFileAPI(false))
    }
    // Socket接続
    const socket = await socketio.connect('https://192.168.1.254:3000/', {secure: true})
    // const socket = socketio.connect('https://cast.winds-n.com, {secure: true})
    socket.on('connect', () => {
      dispatch(setSocket(socket))
      if (socket.connected && fileAPI) dispatch(setAvailable(true))
      dispatch(loading(false))
    })
    socket.on('id', async (id) => {
      console.warn('recieve',id)
      dispatch(setID(id))
    })
  }
}

const setFileAPI = (fileAPI) => ({
  type: 'STATUS_SET_FILE_API',
  payload: { fileAPI }
})

const setSocket = (socket) => ({
  type: 'STATUS_SET_SOCKET',
  payload: { socket }
})

const setID = (id) => ({
  type: 'STATUS_SET_ID',
  payload: { id }
})

const setAvailable = (available) => ({
  type: 'STATUS_SET_AVAILABLE',
  payload: { available }
})

export const loading = (loading) => ({
  type: 'STATUS_LOADING',
  payload: { loading }
})

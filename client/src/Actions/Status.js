import { replace } from 'connected-react-router'
import { divisionWidth } from '../Library/Library'
// import { connectSocket } from './Socket'

const prefix = 'STATUS_'

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

export const windowWidthChange = () => {
  return (dispatch) => {
    const width = window.innerWidth
    const pc = width > divisionWidth ? true : false
    const mobile = !pc
    dispatch(setWidth(width, pc, mobile))
  }
}

export const setWidth = (width, pc, mobile) => ({
  type: prefix + 'WINDOW_WIDTH',
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
    // if (socket.connected && fileAPI) dispatch(setAvailable(true))
    dispatch(loading(false))
  }
}

const setFileAPI = (fileAPI) => ({
  type: prefix + 'SET_FILE_API',
  payload: { fileAPI }
})

const setAvailable = (available) => ({
  type: prefix + 'SET_AVAILABLE',
  payload: { available }
})
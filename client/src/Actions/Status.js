import { replace } from 'connected-react-router'
import { divisionWidth } from '../Library/Library'

export const setLocation = (location) => {
  return async (dispatch) => {
    // dispatch(replace(location))
  }
}

export const logout = () => {
  return async (dispatch) => {
    window.localStorage.clear()
    dispatch(loginUpdate(false))
  }
}

export const loading = (loading) => ({
  type: 'STATUS_LOADING',
  payload: {
    loading: loading
  }
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
  type: 'STATUS_WINDOW_WIDTH',
  payload: {
    width,
    pc,
    mobile
  }
})
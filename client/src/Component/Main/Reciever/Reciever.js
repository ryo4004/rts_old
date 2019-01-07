import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

// import { loadList } from '../../../Actions/Reader'

import { prepare } from '../../../Actions/Status'

import { getDate } from '../../../Library/Library'

import './Reciever.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,

    fileAPI: state.status.fileAPI,
    socket: state.status.socket,
    id: state.status.id,
    available: state.status.available
  }
}

function mapDispatchToProps(dispatch) {
  return {
    prepare () {
      dispatch(prepare())
    }
  }
}

class Reciever extends Component {
  constructor (props) {
    super(props)
    // this.props.loadList()
  }

  componentDidMount () {
    this.props.prepare()
  }

  onDrop (accept, rejected) {
    console.log(accept, rejected)
  }

  onDragover (e) {
    e.preventDefault()
  }

  onDrop (e) {
    console.log('Drop')
    e.preventDefault()
    console.log(e)
    console.log(e.dataTransfer.files)
    if (e.dataTransfer.files.length !== 1) return false
  }

  renderPrepare () {
    const available = this.props.available === true ? 'OK' : 'NG'
    const socketid = this.props.socket ? this.props.socket.id : '-'
    const id = this.props.id ? this.props.id : '-'
    return (
      <div className='prepare'>
        <div>status: {available}</div>
        <div>id: {socketid}</div>
        <div>url: https://192.168.1.254/{id}</div>
      </div>
    )
  }

  render () {
    // State List
    const { mobile, loading, fileAPI, socket } = this.props
    // Dispatch List
    // const { logout } = this.props
    const mobileMode = mobile ? ' mobile' : ' pc'

    const prepare = this.renderPrepare()
    return (
      <div className={'home' + mobileMode}>
        <header>
          <div>
            <h2><Link to='/'>RTS</Link></h2>
          </div>
        </header>
        <div className='status'>
          {prepare}
          <div className='file-input' onDragOver={(e) => this.onDragover(e)} onDrop={(e) => this.onDrop(e)} >
            <label className='file'>ファイルを準備
              <input type='file' className='file' />
            </label>
          </div>
          {/* <button className='standby'></button> */}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Reciever)

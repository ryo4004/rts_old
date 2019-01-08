import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

// import { loadList } from '../../../Actions/Reader'

import { prepare } from '../../../Actions/Status'
import { connectSocket } from '../../../Actions/Reciever'

import './Reciever.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,

    socket: state.reciever.socket,
    selfID: state.reciever.selfID,
    senderID: state.reciever.senderID,

    fileAPI: state.status.fileAPI,
    available: state.status.available
  }
}

function mapDispatchToProps(dispatch) {
  return {
    prepare () {
      dispatch(prepare())
    },
    connectSocket (otherid) {
      dispatch(connectSocket(otherid))
    }
  }
}

class Reciever extends Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    this.props.prepare()
    const { params } = this.props.match
    const senderID = params.senderID ? params.senderID : ''
    this.props.connectSocket(senderID)

    // 接続リクエストする
    this.requestPeer()
  }

  requestPeer () {
    
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
    const socketID = this.props.socket ? this.props.socket.id : '-'
    const selfID = this.props.selfID ? this.props.selfID : '-'
    const senderID = this.props.senderID ? this.props.senderID : '-'
    return (
      <div className='prepare'>
        <div>status: {available}</div>
        <div>socketid: {socketID}</div>
        <div>selfID: {selfID}</div>
        <div>senderID: {senderID}</div>
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
      <div className={'reciever' + mobileMode}>
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

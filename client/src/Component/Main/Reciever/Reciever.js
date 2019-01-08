import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

// import { loadList } from '../../../Actions/Reader'

import { prepare } from '../../../Actions/Status'
import { connectSocket } from '../../../Actions/Socket'

import { getDate } from '../../../Library/Library'

import './Reciever.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,

    socket: state.socket.socket,
    selfid: state.socket.selfid,
    otherid: state.socket.otherid,

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
    const otherid = params.otherid ? params.otherid : ''
    this.props.connectSocket(otherid)
    console.warn(this.props)

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
    const socketid = this.props.socket ? this.props.socket.id : '-'
    return (
      <div className='prepare'>
        <div>status: {available}</div>
        <div>socketid: {socketid}</div>
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

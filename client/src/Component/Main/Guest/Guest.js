import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

import { prepare } from '../../../Actions/Status'
import { receiverConnect, disconnect } from '../../../Actions/Connection'

import FileController from '../FileController/FileController'

import './Guest.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,
    fileAPI: state.status.fileAPI,
    available: state.status.available,

    // connection
    selfID: state.connection.selfSocketID,
    senderID: state.connection.senderSocketID,
    dataChannelOpenStatus: state.connection.dataChannelOpenStatus,

    // ファイル受信用
    receiveFileList: state.receiver.receiveFileList,
    receiveFileUrlList: state.receiver.receiveFileUrlList
  }
}

function mapDispatchToProps(dispatch) {
  return {
    prepare () {
      dispatch(prepare())
    },
    receiverConnect (senderSocketID) {
      dispatch(receiverConnect(senderSocketID))
    },
    disconnect () {
      dispatch(disconnect())
    }
  }
}

class Guest extends Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    this.props.prepare()
    const { params } = this.props.match
    const senderSocketID = params.senderSocketID ? params.senderSocketID : ''
    this.props.receiverConnect(senderSocketID)
  }

  componentWillUnmount () {
    this.props.disconnect()
  }

  renderStatus () {
    // const available = this.props.available === true ? 'OK' : 'NG'
    // const socketID = this.props.socket ? this.props.socket.id : '-'
    // const selfID = this.props.selfID ? this.props.selfID : '-'
    // const senderID = this.props.senderID ? this.props.senderID : '-'
    return (
      <div className='status'>
        {/* <div>status: {available}</div>
        <div>socketid: {socketID}</div>
        <div>selfID: {selfID}</div>
        <div>senderID: {senderID}</div> */}
        <div className='data-channel-status'><div className={this.props.dataChannelOpenStatus ? 'ok' : 'ng'}><span>{this.props.dataChannelOpenStatus ? <i className='fas fa-check-circle'></i> : <i className='fas fa-times-circle'></i>}</span><label>dataChannel</label></div></div>
      </div>
    )
  }

  render () {
    const mobileMode = this.props.mobile ? ' mobile' : ' pc'
    const status = this.renderStatus()
    return (
      <div className={'receiver' + mobileMode}>
        <header>
          <div>
            <h2><Link to='/'>Real-Time File Sharing</Link></h2>
          </div>
        </header>
        <div className='main'>
          {status}
          <FileController />
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Guest)

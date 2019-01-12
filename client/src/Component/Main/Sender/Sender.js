import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

// import { loadList } from '../../../Actions/Reader'

import { prepare } from '../../../Actions/Status'
import { setFileList, connectSocket, sendData, sendFile } from '../../../Actions/Sender'

import './Sender.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,

    fileList: state.sender.fileList,

    socket: state.sender.socket,
    selfID: state.sender.selfID,
    receiverID: state.sender.receiverID,

    fileAPI: state.status.fileAPI,
    available: state.status.available,

    sentDataInfo: state.sender.sentDataInfo,
    sentDataCount: state.sender.sentDataCount,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    setFileList (fileList) {
      dispatch(setFileList(fileList))
    },
    connectSocket () {
      dispatch(connectSocket(false))
    },
    sendData () {
      dispatch(sendData())
    },
    sendFile () {
      dispatch(sendFile())
    }
  }
}

class Sender extends Component {
  constructor (props) {
    super(props)
    // this.props.loadList()
  }

  componentDidMount () {
    this.props.connectSocket()
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
    this.props.setFileList(e.dataTransfer.files)
  }

  fileSelect (e) {
    console.warn(e.target.files)
    this.props.setFileList(e.target.files)
  }

  renderPrepare () {
    const available = this.props.available === true ? 'OK' : 'NG'
    const socketID = this.props.socket ? this.props.socket.id : '-'
    const selfID = this.props.selfID ? this.props.selfID : '-'
    const receiverID = this.props.receiverID ? this.props.receiverID : '-'
    return (
      <div className='prepare'>
        <div>status: {available}</div>
        <div>socketID: {socketID}</div>
        <div>selfID: {selfID}</div>
        <div>receiverID: {receiverID}</div>
        <div>url: <a href={'https://192.168.1.254:3000/' + selfID} target='_blank'>https://192.168.1.254:3000/{selfID}</a></div>
      </div>
    )
  }

  renderFileList () {
    if (!this.props.fileList) return false
    return <div>SET</div>
  }

  renderSentInfo () {
    if (!this.props.sentDataInfo) return
    return (
      <div>
        <span>{this.props.sentDataCount}</span>/<span>{this.props.sentDataInfo.size.sendTotal}</span>
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
    const fileList = this.renderFileList()
    const sentInfo = this.renderSentInfo()

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
              <input type='file' className='file' onChange={(e) => this.fileSelect(e)} />
            </label>
            {fileList}
            {sentInfo}
            <button className='test' onClick={() => this.props.sendData()}>送信</button>
            <button className='test' onClick={() => this.props.sendFile()}>ファイル送信</button>
          </div>
          {/* <button className='standby'></button> */}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Sender)

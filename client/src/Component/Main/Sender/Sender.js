import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

import { addFile, connectSocket, sendData, sendFile } from '../../../Actions/Sender'

import { fileSizeUnit } from '../../../Library/Library'

import './Sender.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,

    fileList: state.sender.fileList,
    sendFileList: state.sender.sendFileList,
    sendFileStorage: state.sender.sendFileStorage,

    socket: state.sender.socket,
    selfID: state.sender.selfID,
    receiverID: state.sender.receiverID,

    dataChannelOpenStatus: state.sender.dataChannelOpenStatus,

    fileAPI: state.status.fileAPI,
    available: state.status.available,

    sentDataInfo: state.sender.sentDataInfo,
    sentDataCount: state.sender.sentDataCount,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    addFile (fileList) {
      dispatch(addFile(fileList))
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
    this.props.addFile('onDrop', e.dataTransfer.files)
  }

  fileSelect (e) {
    console.warn('fileSelect', e.target.files)
    this.props.addFile(e.target.files)
  }

  renderPrepare () {
    const available = this.props.available === true ? 'OK' : 'NG'
    const socketID = this.props.socket ? this.props.socket.id : '-'
    const selfID = this.props.selfID ? this.props.selfID : '-'
    const receiverID = this.props.receiverID ? this.props.receiverID : '-'
    const dataChannel = this.props.dataChannelOpenStatus ? 'OK' : 'NG'
    const url = 'https://192.168.1.254:3000/' + selfID
    // const url = 'https://rts.zatsuzen.com/' + selfID
    return (
      <div className='prepare'>
        <div>status: {available}</div>
        <div>socketID: {socketID}</div>
        <div>selfID: {selfID}</div>
        <div>receiverID: {receiverID}</div>
        <div>url: <a href={url} target='_blank'>{url}</a></div>
        <button onClick={(e) => this.copy(e, url)}>コピー</button>
        <div>dataChannel: {dataChannel}</div>
      </div>
    )
  }

  copy (e, url) {
    e.preventDefault()
    console.log(url)
    const div = document.createElement('div')
    div.appendChild(document.createElement('pre')).textContent = url
    document.body.appendChild(div)
    document.getSelection().selectAllChildren(div)
    document.execCommand("copy")
    document.body.removeChild(div)
  }

  renderFileList () {
    // console.warn('sendDataList',this.props.sendFileList)
    if (!this.props.sendFileList || Object.keys(this.props.sendFileList).length === 0) return <div>追加してください</div>
    // console.warn('render', this.props.sendFileList)

    const sendFileList = Object.keys(this.props.sendFileList).map((id, i) => {
      const each = this.props.sendFileList[id]
      // const load = each.load === false ? 'wait' : (each.load === 100 ? 'loaded' : (each.load !== false ? 'standby' : each.load + '%'))
      // // const send = each.send !== false ? 'standby' : (each.send === 100 ? 'sent' : (each.send === false ? 'wait' : each.send + '%'))
      // const send = each.send === false ? 'wait' : (each.send === 100 ? 'sent' : (each.send !== false ? 'standby' : each.send + '%'))

      const load = each.load === false ? 'wait' : each.load + '%'
      const send = each.send === false ? (each.load ? 'File Loading ...' : 'not send') : (each.send).toFixed(1) + '%'

      const loadProgress = each.load ? {backgroundSize: each.load + '% 100%'} : {backgroundSize: '0% 100%'}
      const sendProgress = each.send ? {backgroundSize: each.send + '% 100%'} : {backgroundSize: '0% 100%'}

      const sendSize = isNaN(each.send) ? '-' : fileSizeUnit(each.size * each.send / 100)
      const fileSize = fileSizeUnit(each.size)

      return (
        <li key={'filelist-' + i}>
          <div>{each.name}</div>
          <div className='send-percent'>{send}</div>
          <div className='send-progress-bar'>
            <div className='send-progress' style={sendProgress}></div>
            <div className='load-progress' style={loadProgress}></div>
          </div>
          <div className='send-size'>{sendSize} / {fileSize}</div>
        </li>
      )
    })
    return <div><ul>{sendFileList}</ul></div>
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
    // console.log('render')
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
            <label className='file'>共有するファイルを追加
              <input type='file' className='file' onChange={(e) => this.fileSelect(e)} multiple />
            </label>
            <button className='test' onClick={() => this.props.sendData()}>送信</button>
            {fileList}
            {sentInfo}
            {/* <button className='test' onClick={() => this.props.sendFile()}>ファイル送信</button> */}
          </div>
          {/* <button className='standby'></button> */}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Sender)

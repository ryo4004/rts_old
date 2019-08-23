import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

import { prepare } from '../../../Actions/Status'
import { senderConnect, disconnect } from '../../../Actions/Connection'
import { addFile, sendData, deleteFile } from '../../../Actions/Sender'

import FileController from '../FileController/FileController'

import './Host.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,
    fileAPI: state.status.fileAPI,
    available: state.status.available,

    // connection
    selfID: state.connection.selfSocketID,
    receiverID: state.connection.receiverSocketID,
    dataChannelOpenStatus: state.connection.dataChannelOpenStatus,

    // ファイル送信用
    fileList: state.sender.fileList,
    sendFileList: state.sender.sendFileList,
    sendFileStorage: state.sender.sendFileStorage,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    prepare () {
      dispatch(prepare())
    },
    senderConnect () {
      dispatch(senderConnect())
    },
    disconnect () {
      dispatch(disconnect())
    },
    addFile (fileList) {
      dispatch(addFile(fileList))
    },
    sendData () {
      dispatch(sendData())
    },
    deleteFile (id) {
      dispatch(deleteFile(id))
    }
  }
}

class Host extends Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    this.props.senderConnect()
  }
  
  componentWillUnmount () {
    this.props.disconnect()
  }

  renderTutorial() {
    const selfID = this.props.selfID ? this.props.selfID : false
    const url = selfID ? 'https://' + location.host + '/' + selfID : 'generating...'
    const qrCode = selfID ? <img className='qr-code' src={'https://chart.apis.google.com/chart?cht=qr&chs=150x150&chl=' + url} /> : false
    return (
      <div className='tutorial'>
        <h3>使い方</h3>
        <ol>
          <li>共有URLをファイルを受け取る相手に通知します</li>
          <li>自動的に相手との間にP2P接続を試みます</li>
          <li>相手との間に接続が確立するとdataChannelマークが<i className='fas fa-check-circle'></i>になります</li>
          <li>ファイルを追加して送信ボタンを押すとファイルを送信できます</li>
        </ol>
        {/* <div className='url'><span>共有URL</span><a href={url} target='_blank'>{url}</a><button onClick={(e) => this.copy(e, url)} className='copy-button'><i className='fas fa-clone'></i></button></div> */}
        <div className='url'><span>共有URL</span><div onClick={(e) => this.copy(e, url)} className='copy-button'>{url}<i className='fas fa-clone'></i></div></div>
        <span className='url-guide'>URLをクリックでコピー</span>
        {qrCode}
      </div>
    )
  }

  renderStatus () {
    // const available = this.props.available === true ? 'OK' : 'NG'
    // const socketID = this.props.socket ? this.props.socket.id : '-'
    // const selfID = this.props.selfID ? this.props.selfID : '-'
    // const receiverID = this.props.receiverID ? this.props.receiverID : '-'
    return (
      <div className='status'>
        {/* <div>status: {available}</div>
        <div>socketID: {socketID}</div>
        <div>selfID: {selfID}</div>
        <div>receiverID: {receiverID}</div> */}
        <div className='data-channel-status'><div className={this.props.dataChannelOpenStatus ? 'ok' : 'ng'}><span>{this.props.dataChannelOpenStatus ? <i className='fas fa-check-circle'></i> : <i className='fas fa-times-circle'></i>}</span><label>dataChannel</label></div></div>
      </div>
    )
  }

  copy (e, url) {
    e.preventDefault()
    // console.log(url)
    const div = document.createElement('div')
    div.appendChild(document.createElement('pre')).textContent = url
    document.body.appendChild(div)
    document.getSelection().selectAllChildren(div)
    document.execCommand("copy")
    document.body.removeChild(div)
  }

  render () {
    const mobileMode = this.props.mobile ? ' mobile' : ' pc'
    const tutorial = this.renderTutorial()
    const status = this.renderStatus()
    return (
      <div className={'host' + mobileMode}>
        <header>
          <div>
            <h2><Link to='/'>Real-Time File Transfer</Link></h2>
          </div>
        </header>
        <div className='main'>
          {tutorial}
          {status}
          <FileController />
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Host)

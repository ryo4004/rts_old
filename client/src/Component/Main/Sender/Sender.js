import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

import { confirmAlert } from 'react-confirm-alert'

import { addFile, connectSocket, sendData, sendFile, deleteFile } from '../../../Actions/Sender'

import { fileSizeUnit, fileIcon } from '../../../Library/Library'

import './Sender.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,

    socket: state.sender.socket,
    selfID: state.sender.selfID,
    receiverID: state.sender.receiverID,

    fileList: state.sender.fileList,
    sendFileList: state.sender.sendFileList,
    sendFileStorage: state.sender.sendFileStorage,

    dataChannelOpenStatus: state.sender.dataChannelOpenStatus,

    fileAPI: state.status.fileAPI,
    available: state.status.available,

    // sentDataInfo: state.sender.sentDataInfo,
    // sentDataCount: state.sender.sentDataCount,
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
    },
    deleteFile (id) {
      dispatch(deleteFile(id))
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
    console.log('fileSelect', e.target.files)
    this.props.addFile(e.target.files)
  }

  renderTutorial() {
    const selfID = this.props.selfID ? this.props.selfID : false
    const url = selfID ? 'https://' + location.host + '/' + selfID : 'generating...'
    const qrCode = selfID ? <img className='qr-code' src={'https://chart.apis.google.com/chart?cht=qr&chs=150x150&chl=' + url} /> : false
    return (
      <div className='tutorial'>
        <h3>これはなに？</h3>
        <p>
          WebRTCを利用したファイル転送サービスです。
          WebRTCはユーザー同士によるP2P接続により直接データのやりとりが行えることができます。
          P2P接続では直接データのやりとりを行うためセキュアに通信することができます。
          Web上に送信したデータが残ることはありません。
          双方がページを開いている間だけデータの送受信ができます。
        </p>
        <h3>免責事項</h3>
        <p>
          このサービスを利用して発生したいかなる損害にも責任を負いません。
        </p>
        <h3>使い方</h3>
        <ol>
          <li>共有URLをファイルを受け取る相手に通知します</li>
          <li>自動的に相手との間にP2P接続を試みます</li>
          <li>相手との間に接続が確立するとdataChannelマークが<i className='fas fa-check-circle'></i>になります</li>
          <li>ファイルを追加してから送信ボタンを押すとファイルを送信できます</li>
        </ol>
        <div className='url'><span>共有URL</span><a href={url} target='_blank'>{url}</a><button onClick={(e) => this.copy(e, url)} className='copy-button'><i className='fas fa-clone'></i></button></div>
        {qrCode}
      </div>
    )
  }

  renderStatus () {
    const available = this.props.available === true ? 'OK' : 'NG'
    const socketID = this.props.socket ? this.props.socket.id : '-'
    const selfID = this.props.selfID ? this.props.selfID : '-'
    const receiverID = this.props.receiverID ? this.props.receiverID : '-'
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
    console.log(url)
    const div = document.createElement('div')
    div.appendChild(document.createElement('pre')).textContent = url
    document.body.appendChild(div)
    document.getSelection().selectAllChildren(div)
    document.execCommand("copy")
    document.body.removeChild(div)
  }

  deleteConfirm (id) {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className='alert'>
            <h1>削除しますか？</h1>
            <p>送信済みファイルの場合は相手側のダウンロードもできなくなります</p>
            <div className='button-group'>
              <button onClick={onClose}>キャンセル</button>
              <button onClick={() => {
                this.props.deleteFile(id)
                // Actions.toastShow('ログアウトしました')
                onClose()
              }}>削除</button>
            </div>
          </div>
        )
      }
    })
  }

  renderFileList () {
    if (!this.props.sendFileList || Object.keys(this.props.sendFileList).length === 0) return <div className='no-file'><p>ファイルがありません</p><p>追加してください</p></div>
    const sendFileList = Object.keys(this.props.sendFileList).map((id, i) => {
      const each = this.props.sendFileList[id]
      const icon = <i className={fileIcon(each.name, each.type)}></i>
      const fileSize = fileSizeUnit(each.size)

      if (each.delete) return (
        <li key={'filelist-' + i} className='send-filelist deleted'>
          <div className='send-status'><span><span>取り消しました</span></span></div>
          <div className='send-info'>
            <div className='file-icon'>{icon}</div>
            <div className='detail'>
              <div className='file-name'>{each.name}</div>
              <div className='send-size'>{fileSize}</div>
            </div>
          </div>
        </li>
      )

      // load はファイルをあらかじめ開く場合に必要
      // const load = each.load === false ? 'wait' : each.load + '%'
      // const loadProgress = each.load ? {backgroundSize: each.load + '% 100%'} : {backgroundSize: '0% 100%'}
      const sendPercent = each.send === false ? <div className='send-percent standby'></div> : (each.send !== 100 ? <div className='send-percent sending'>{(each.send).toFixed(1) + '%'}</div> : <div className={'send-percent' + (each.receiveComplete ? ' complete' : '')}>{each.send + '%'}</div>)
      const status = each.send === false ? (each.load ? <span>ファイル読み込み中...</span> : <span>未送信</span>) : (each.send !== 100 ? <span>送信中</span> : (each.receiveComplete === false ? <span>受信待機中</span> : (each.receiveResult ? <span>送信済み</span> : <span>送信失敗</span>)))
      const statusClass = each.send === false ? (each.load ? 'loading' : 'not-send') : (each.send !== 100 ? 'sending' : (each.receiveComplete === false ? 'wait-response' : (each.receiveResult ? 'complete' : 'failed')))
      const sendProgress = each.send ? {backgroundSize: each.send + '% 100%'} : {backgroundSize: '0% 100%'}
      const sendSize = isNaN(each.send) ? '-' : fileSizeUnit(each.size * each.send / 100)
      const progressBar = () => {
        return (
          <div className={'send-progress-bar' + (each.send === false ? ' standby' : (each.receiveComplete ? ' complete' : ' sending'))}>
            <div className='send-progress' style={sendProgress}></div>
            {/* <div className='load-progress' style={loadProgress}></div> */}
          </div>
        )
      }

      return (
        <li key={'filelist-' + i} className='send-filelist'>
          <div className={'send-status' + ' ' + statusClass}><span onClick={() => this.deleteConfirm(each.id)}>{status}<span className='delete'><i className='fas fa-times'></i></span></span></div>
          <div className='send-info'>
            <div className='file-icon'>{icon}{sendPercent}</div>
            <div className='detail'>
              <div className='file-name'>{each.name}</div>
              <div className='send-size'>{fileSize}</div>
              {progressBar()}
              {/* <div className='send-size'>{Math.ceil(each.size * each.send / 100)} / {each.size}</div> */}
            </div>
          </div>
        </li>
      )
    })
    return <div><ul className='send-file-list'>{sendFileList}</ul></div>
  }

  renderSendButton () {
    // if (!this.props.sendFileList || Object.keys(this.props.sendFileList).length === 0) return 'ファイルがない'
    let buttonClass = ' disable'
    // ひとつでも送信処理未完了のものがあれば有効
    Object.keys(this.props.sendFileList).map((id, i) => {
      // if (this.props.sendFileList[id].receiveComplete === false) {
      if (this.props.sendFileList[id].send === false) { buttonClass = ' true' }
    })
    if (!this.props.dataChannelOpenStatus) { buttonClass = ' disable' }
    return <button className={'send-button' + buttonClass} onClick={() => this.props.sendData()}>送信</button>
  }

  render () {
    // console.log('render')
    // State List
    const { mobile, loading, fileAPI, socket } = this.props
    // Dispatch List
    // const { logout } = this.props
    const mobileMode = mobile ? ' mobile' : ' pc'

    const tutorial = this.renderTutorial()
    const status = this.renderStatus()
    const fileList = this.renderFileList()
    // const sentInfo = this.renderSentInfo()

    const sendButton = this.renderSendButton()

    return (
      <div className={'home' + mobileMode}>
        <header>
          <div>
            <h2><Link to='/'>Real-Time File Sharing</Link></h2>
          </div>
        </header>
        <div className='main'>
          {tutorial}
          {status}
          <div className='file-input' onDragOver={(e) => this.onDragover(e)} onDrop={(e) => this.onDrop(e)} >
            <label className='file'>共有するファイルを追加
              <input type='file' className='file' onChange={(e) => this.fileSelect(e)} multiple value='' />
            </label>
            {/* {sentInfo} */}
            {/* <button className='test' onClick={() => this.props.sendFile()}>ファイル送信</button> */}
          </div>
          {sendButton}
          {fileList}
          {/* <button className='standby'></button> */}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Sender)

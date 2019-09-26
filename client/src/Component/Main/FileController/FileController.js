import React, { Component } from 'react'
import { connect } from 'react-redux'
import { confirmAlert } from 'react-confirm-alert'

import { prepare } from '../../../Actions/Status'
import { addFile, sendData, deleteFile } from '../../../Actions/Sender'
import { fileSizeUnit, fileIcon } from '../../../Library/Library'

import './FileController.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,
    fileAPI: state.status.fileAPI,
    available: state.status.available,

    // 送信ボタンに使用
    dataChannelOpenStatus: state.connection.dataChannelOpenStatus,

    // ファイル送信用
    sendFileList: state.sender.sendFileList,
    sendFileStorage: state.sender.sendFileStorage,

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

class FileController extends Component {
  constructor (props) {
    super(props)
  }

  // componentDidMount () {
  //   this.props.senderConnect()
  // }
  
  // onDragover (e) {
  //   e.preventDefault()
  // }

  // onDrop (e) {
  //   console.log('Drop')
  //   e.preventDefault()
  //   console.log(e)
  //   console.log(e.dataTransfer.files)
  //   // if (e.dataTransfer.files.length !== 1) return false
  //   this.props.addFile(e.dataTransfer.files)
  // }

  fileSelect (e) {
    // console.log('fileSelect', e.target.files)
    this.props.addFile(e.target.files)
  }

  renderSendButton () {
    let button = false
    // ひとつでも送信処理未完了のものがあれば有効
    Object.keys(this.props.sendFileList).map((id, i) => {
      if (this.props.sendFileList[id].send === false) { button = true }
    })
    if (!this.props.dataChannelOpenStatus) { button = false }
    const onClickHander = button ? () => this.props.sendData() : () => {return false}
    return <button className={'send-button' + (button ? ' true' : ' disable')} onClick={onClickHander}>送信</button>
  }
  
  renderAddFiles () {
    return (
      // <div className='file-input' onDragOver={(e) => this.onDragover(e)} onDrop={(e) => this.onDrop(e)}>
      <div className='file-input'>
        <label className='file'><i className='fas fa-plus-circle'></i>ファイルを追加<span>ファイルをドロップしても追加できます</span>
          <input type='file' className='file' onChange={(e) => this.fileSelect(e)} multiple value='' />
        </label>
      </div>
    )
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

  renderSendFileList () {
    if (!this.props.sendFileList || Object.keys(this.props.sendFileList).length === 0) return <div className='no-file'><p>ファイルがありません</p><p>追加してください</p></div>
    const sendFileList = Object.keys(this.props.sendFileList).map((id, i) => {
      const each = this.props.sendFileList[id]
      const icon = <i className={fileIcon(each.name, each.type)}></i>
      const fileSize = fileSizeUnit(each.size)
      // '\u00A0'.repeat(String(each.sendTime).length - String(each.sendPacketCount).length) + each.sendPacketCount
      const count = each.send === false ? false : (each.receiveComplete === false ? (each.delete ? false : each.sendPacketCount + '/' + each.sendTime) : false)

      if (each.delete || each.err) {
        const message = each.err ? '読み込みエラー' : '取り消しました'
        const addClass = each.err ? ' err' : ''
        return (
          <li key={'filelist-' + i} className={'send-filelist deleted' + addClass}>
            <div className='send-status'><span><span>{message}</span></span></div>
            <div className='send-info'>
              <div className='file-icon'>{icon}</div>
              <div className='detail'>
                <div className='file-name'>{each.name}</div>
                <div className='send-size'><span>{fileSize}</span><span>{count}</span></div>
              </div>
            </div>
          </li>
        )
      }

      // load はファイルをあらかじめ開く場合に必要
      // const load = each.load === false ? 'wait' : each.load + '%'
      // const loadProgress = each.load ? {backgroundSize: each.load + '% 100%'} : {backgroundSize: '0% 100%'}
      const sendPercent = each.send === false ? <div className='send-percent standby'></div> : (each.send !== 100 ? <div className='send-percent sending'>{(each.send).toFixed(1) + '%'}</div> : <div className={'send-percent' + (each.receiveComplete ? ' complete' : '')}>{each.send + '%'}</div>)
      const status = each.send === false ? (each.load ? <span>ファイル読み込み中...</span> : <span>未送信</span>) : (each.send !== 100 ? <span>送信中</span> : (each.receiveComplete === false ? <span>受信待機中</span> : (each.receiveResult ? <span>送信済み</span> : <span>送信失敗</span>)))
      const statusClass = each.send === false ? (each.load ? 'loading' : 'not-send') : (each.send !== 100 ? 'sending' : (each.receiveComplete === false ? 'wait-response' : (each.receiveResult ? 'complete' : 'failed')))
      const sendProgress = each.send ? {backgroundSize: each.send + '% 100%'} : {backgroundSize: '0% 100%'}
      // const sendSize = isNaN(each.send) ? '-' : fileSizeUnit(each.size * each.send / 100)
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
              <div className='send-size'><span>{fileSize}</span><span>{count}</span></div>
              {progressBar()}
            </div>
          </div>
        </li>
      )
    })
    return <div><ul className='send-file-list'>{sendFileList}</ul></div>
  }

  renderReceiveFileList () {
    if (!this.props.receiveFileList || Object.keys(this.props.receiveFileList).length === 0) return <div className='no-file'><p>まだファイルがありません</p><p>相手がファイルを追加するとここに表示されます</p></div>
    // console.warn('render', this.props.receiveFileList)
    const receiveFileList = Object.keys(this.props.receiveFileList).map((id, i) => {
      const each = this.props.receiveFileList[id]
      const icon = <i className={fileIcon(each.name, each.type)}></i>
      const fileSize = fileSizeUnit(each.size)

      // 削除もしくはエラー
      if (each.delete || each.err) {
        const message = each.err ? 'エラー' : '取り消されました'
        const addClass = each.err ? ' err' : ''
        return (
          <li key={'filelist-' + i} className={'receive-filelist deleted' + addClass}>
            <div className='receive-status'><span>{message}</span></div>
            <div className='receive-info'>
              <div className='file-icon'>{icon}</div>
              <div className='detail'>
                <div className='file-name'>{each.name}</div>
                <div className='receive-size'>{fileSize}</div>
              </div>
            </div>
          </li>
        )
      }

      // 受信完了後
      if (this.props.receiveFileUrlList[each.id] && each.receiveResult) {
        return (
          <li key={'filelist-' + i} className='receive-filelist complete'>
            <a href={this.props.receiveFileUrlList[each.id]} download={each.name}>
              <div className='receive-status complete'><span>完了</span></div>
              <div className='receive-info'>
                <div className='file-icon'>{icon}</div>
                <div className='detail'>
                  <div className='file-name'>{each.name}</div>
                  <div className='receive-size'>{fileSize}</div>
                </div>
              </div>
            </a>
          </li>
        )
      }

      const status = each.receive === false ? <span>未受信</span> : each.receive !== 100 ? <span>受信中</span> : (each.receiveComplete === false ? <span>処理中</span> : (each.receiveResult ? <span>完了</span> : <span>受信失敗</span>))
      const statusClass = each.receive === false ? 'not-receive' : each.receive !== 100 ? 'receiving' : (each.receiveComplete === false ? 'wait-response' : (each.receiveResult ? 'complete' : 'failed'))
      // const receiveSize = isNaN(each.receive) ? '-' : fileSizeUnit(each.size * each.receive / 100)
      const receivePercent = each.receive === false ? <div className='receive-percent standby'>{each.receive + '%'}</div> : (each.receive !== 100 ? <div className='receive-percent receiving'>{(each.receive).toFixed(1) + '%'}</div> : <div className='receive-percent complete'>{each.receive + '%'}</div>)
      const receiveProgress = each.receive ? {backgroundSize: each.receive + '% 100%'} : {backgroundSize: '0% 100%'}
      // const count = each.receivePacketCount + '/' + each.sendTime
      const count = each.receive === false ? false : (each.receiveResult === false ? each.receivePacketCount + '/' + each.sendTime : false)
      const progressBar = () => {
        return (
          <div className={'receive-progress-bar' + (each.receive === false ? ' standby' : (each.receive !== 100 ? ' receiving' : ' complete'))}>
            <div className='receive-progress' style={receiveProgress}></div>
          </div>
        )
      }

      return (
        <li key={'filelist-' + i} className='receive-filelist'>
          <div className={'receive-status' + ' ' + statusClass}>{status}</div>
          <div className='receive-info'>
            <div className='file-icon'>{icon}{receivePercent}</div>
            <div className='detail'>
              <div className='file-name'><span>{each.name}</span></div>
              <div className='receive-size'><span>{fileSize}</span><span>{count}</span></div>
              {progressBar()}
            </div>
          </div>
        </li>
      )
    })
    return <div><ul className='receive-file-list'>{receiveFileList}</ul></div>
  }

  // デバッグ用
  show () {
    // console.log('send', this.props.sendFileList, 'receive', this.props.receiveFileList)
  }

  render () {

    const addFiles = this.renderAddFiles()
    const sendButton = this.renderSendButton()
    const sendFileList = this.renderSendFileList()

    const receiveFileList = this.renderReceiveFileList()

    return (
      <div className='file-controller'>
        {/* デバッグ用 */}
        {/* <button onClick={() => this.show()}>表示</button> */}
        <div className='file-send'>
          <label>送信ファイル</label>
          {addFiles}
          {sendFileList}
          {sendButton}
        </div>
        <div className='file-receive'>
          <label>受信ファイル</label>
          {receiveFileList}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FileController)

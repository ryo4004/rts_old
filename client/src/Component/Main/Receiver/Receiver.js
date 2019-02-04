import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

// import { loadList } from '../../../Actions/Reader'

import { prepare } from '../../../Actions/Status'
import { connectSocket } from '../../../Actions/Receiver'

import { fileSizeUnit, fileIcon } from '../../../Library/Library'

import './Receiver.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,

    socket: state.receiver.socket,
    selfID: state.receiver.selfID,
    senderID: state.receiver.senderID,

    receiveFileList: state.receiver.receiveFileList,
    receiveFileStorage: state.receiver.receiveFileStorage,

    dataChannelOpenStatus: state.receiver.dataChannelOpenStatus,

    fileAPI: state.status.fileAPI,
    available: state.status.available,

    // receivedDataInfo: state.receiver.receivedDataInfo,
    // receivedDataCount: state.receiver.receivedDataCount,
    receiveFileUrlList: state.receiver.receiveFileUrlList,
    // receivedFileUrl: state.receiver.receivedFileUrl
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

class Receiver extends Component {
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

  // update (e) {
  //   e.preventDefault()
  //   console.log('Render')
  //   this.render()
  // }

  renderStatus () {
    const available = this.props.available === true ? 'OK' : 'NG'
    const socketID = this.props.socket ? this.props.socket.id : '-'
    const selfID = this.props.selfID ? this.props.selfID : '-'
    const senderID = this.props.senderID ? this.props.senderID : '-'
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

  renderFileList () {
    if (!this.props.receiveFileList || Object.keys(this.props.receiveFileList).length === 0) return <div className='no-file'><p>まだファイルがありません</p><p>相手がファイルを追加するとここに表示されます</p></div>
    // console.warn('render', this.props.receiveFileList)
    const receiveFileList = Object.keys(this.props.receiveFileList).map((id, i) => {
      const each = this.props.receiveFileList[id]
      const icon = <i className={fileIcon(each.name, each.type)}></i>
      const fileSize = fileSizeUnit(each.size)

      // 削除されたとき
      if (each.delete) return (
        <li key={'filelist-' + i} className='receive-filelist deleted'>
          <div className='receive-status'><span>取り消されました</span></div>
          <div className='receive-info'>
            <div className='file-icon'>{icon}</div>
            <div className='detail'>
              <div className='file-name'>{each.name}</div>
              <div className='receive-size'>{fileSize}</div>
            </div>
          </div>
        </li>
      )

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
              <div className='receive-size'>{fileSize}</div>
              {progressBar()}
            </div>
          </div>
        </li>
      )
    })
    return <div><ul className='receive-file-list'>{receiveFileList}</ul></div>
  }

  // renderReceivedInfo () {
  //   if (!this.props.receivedDataInfo) return
  //   return (
  //     <div>
  //       <span>{this.props.receivedDataCount}</span>/<span>{this.props.receivedDataInfo.size.sendTotal}</span>
  //     </div>
  //   )
  // }

  // renderReceivedFileDownload () {
  //   if (!this.props.receivedFileUrl) return
  //   return (
  //     <div>
  //       <a href={this.props.receivedFileUrl} download>Download</a>
  //     </div>
  //   )
  // }

  render () {
    // State List
    const { mobile, loading, fileAPI, socket } = this.props
    // Dispatch List
    // const { logout } = this.props
    const mobileMode = mobile ? ' mobile' : ' pc'

    const status = this.renderStatus()
    const fileList = this.renderFileList()
    // const receivedInfo = this.renderReceivedInfo()
    // const receivedFileDownload = this.renderReceivedFileDownload()
    
    return (
      <div className={'receiver' + mobileMode}>
        <header>
          <div>
            <h2><Link to='/'>Real-Time File Sharing</Link></h2>
          </div>
        </header>
        <div className='main'>
          {status}
          {/* {receivedInfo} */}
          {/* <div className='file-input' onDragOver={(e) => this.onDragover(e)} onDrop={(e) => this.onDrop(e)} > */}
          <div className='file-input'>
            {/* <label className='file'>ファイルを準備
              <input type='file' className='file' />
            </label> */}
          </div>
          {fileList}
          {/* {receivedFileDownload} */}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Receiver)

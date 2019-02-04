import socketio from 'socket.io-client'
import uniqid from 'uniqid'

import { randomString, stringToBuffer, bufferToString } from '../Library/Library'

const prefix = 'SENDER_'

let peerConnection = null
let dataChannel = null

// 定数
// ファイルIDは16文字
let idLength = 16
// 終了フラグサイズ
let flagLength = 1
let packetSize = 1024 * 16 - flagLength - idLength

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

function updateSendFileList (id, property, value, dispatch, getState) {
  // JSON.parse(JSON.stringify())は使わない
  const sendFileList = {}
  Object.assign(sendFileList, getState().sender.sendFileList)
  sendFileList[id][property] = value
  dispatch(setSendFileList(sendFileList))
}

// function openFile (id, file, dispatch, getState) {
//   let fileReader = new FileReader()
//   fileReader.onloadstart = (event) => {
//     updateSendFileList(id, 'load', 0, dispatch, getState)
//   }
//   // fileReader.onabort = (event) => { console.log('fileReader onabort', event) }
//   // fileReader.onerror = (event) => { console.log('fileReader onerror', event) }
//   fileReader.onloadend = (event) => {
//     updateSendFileList(id, 'load', 100, dispatch, getState)
//   }
//   fileReader.onprogress = (event) => {
//     const percent = Math.ceil(event.loaded / event.total * 1000.0) / 10.0
//     updateSendFileList(id, 'load', percent, dispatch, getState)
//   }
//   fileReader.onload = (event) => {
//     let data = new Uint8Array(event.target.result)
//     updateSendFileList(id, 'byteLength', data.byteLength, dispatch, getState)
//     updateSendFileList(id, 'sendTime', Math.ceil(data.byteLength / packetSize), dispatch, getState)
//     updateSendFileList(id, 'rest', data.byteLength % packetSize, dispatch, getState)
//     // let sendFileStorage = {}
//     // Object.assign(sendFileStorage, getState().sender.sendFileStorage)
//     // sendFileStorage[id] = data
//     // dispatch(setSendFileStorage(sendFileStorage))
//   }
//   fileReader.readAsArrayBuffer(file)
// }

export const addFile = (fileList) => {
  return (dispatch, getState) => {
    dispatch(setFileList(fileList))
    Object.keys(fileList).forEach((num) => {
      // ファイルごとにid生成
      const id = randomString()
      // sendFileListに追加する
      let sendFileList = {
        [id]: {
          id: id,
          timestamp: (new Date()).getTime(),
          add: true,
          delete: false,

          // Sender用プロパティ(変更不可)
          // 読み込み状態
          load: false,
          // receiverへfileInfo送信フラグ
          preSendInfo: false,
          // ファイル送信フラグ
          send: false,
          // packet追加用
          idBuffer: stringToBuffer(id),
          // packetCount
          sendPacketCount: 0,
          // 送受信処理終了フラグ
          receiveComplete: false,
          // 送受信結果
          receiveResult: false,

          // Receiver用プロパティ(変更不可)
          // receive: false, (ファイルリスト送信時に追加する)
          // preReceiveInfo: false, (ファイルリスト送信時に追加する)
          // receivePacketCount: 0, (ファイルリスト送信時に追加する)

          // ファイルサイズ情報
          byteLength: fileList[num].size,
          sendTime: Math.ceil(fileList[num].size / packetSize),
          rest: fileList[num].size % packetSize,

          // ファイル情報
          lastModified: fileList[num].lastModified,
          name: fileList[num].name,
          size: fileList[num].size,
          type: fileList[num].type,
          webkitRelativePath: fileList[num].webkitRelativePath,

          // file object (FileReaderで利用)
          file: fileList[num]
        }
      }
      Object.assign(sendFileList, getState().sender.sendFileList)
      dispatch(setSendFileList(sendFileList))
      // 送信直前に開くのでここではファイルにアクセスしない
      // openFile(id, fileList[num], dispatch, getState)

      // ファイルリスト情報を送信する (dataChannelが閉じている場合はなにもしない)
      // sendFileListOnDataChannel(id, sendFileList, dispatch, getState)
    })
    sendFileListOnDataChannel(dispatch, getState)
  }
}

// 追加したファイルを1つ削除
export const deleteFile = (id) => {
  return (dispatch, getState) => {
    const deleteFileList = getState().sender.sendFileList[id]
    // preSendInfoを送信済みの場合はReceiverに削除を通知する
    if (deleteFileList.preSendInfo === true) {
      const deleteFileInfo = {
        delete: {
          id: id,
        }
      }
      dataChannel.send(JSON.stringify(deleteFileInfo))
    }
    console.log('ファイル削除')
    updateSendFileList(id, 'delete', true, dispatch, getState)
  }
}

function sendFileListOnDataChannel (dispatch, getState) {
  if (getState().sender.dataChannelOpenStatus) {
    const sendFileList = getState().sender.sendFileList
    Object.keys(sendFileList).reverse().forEach((num) => {
      const id = sendFileList[num].id
      if (!sendFileList[num].preSendInfo) {
        const sendFileInfo = {
          add: {
            [id]: Object.assign({}, sendFileList[id])
          }
        }
        // Receiverに不要な情報を削除
        delete sendFileInfo.add[id].load
        delete sendFileInfo.add[id].preSendInfo
        delete sendFileInfo.add[id].send
        delete sendFileInfo.add[id].sendPacketCount
        delete sendFileInfo.add[id].idBuffer
        delete sendFileInfo.add[id].file
        sendFileInfo.add[id].receive = false
        sendFileInfo.add[id].preReceiveInfo = false
        sendFileInfo.add[id].receivePacketCount = 0
        console.log('preSendInfo')
        dataChannel.send(JSON.stringify(sendFileInfo))
        updateSendFileList(id, 'preSendInfo', true, dispatch, getState)
      }
    })
  }
}

const setFileList = (fileList) => ({
  type: prefix + 'SET_FILELIST',
  payload: { fileList }
})

const setSendFileList = (sendFileList) => ({
  type: prefix + 'SET_SEND_FILE_LIST',
  payload: { sendFileList }
})

export const connectSocket = () => {
  return async (dispatch, getState) => {
    dispatch(loading(true))
    // Socket接続
    const socket = await socketio.connect('https://' + location.host + '/', {secure: true})
    // const socket = socketio.connect('https://rts.zatsuzen.com', {secure: true})
    socket.on('connect', () => {
      dispatch(setSocket(socket))
    })
    // 受信 connection_complete で自分のIDを取得
    socket.on('connection_complete', (obj) => {
      dispatch(loading(false))
      dispatch(setSelfID(obj.id))
    })
    // 受信 Receiver情報を取得
    socket.on('request_to_sender', (obj) => {
      dispatch(setReceiverID(obj.from))
    })
    // 受信
    socket.on('send_offer_sdp', async (obj) => {
      // PeerConnection作成
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
        iceTransportPolicy: 'all'
      })
      peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel
        dataChannel.onopen = () => {
          console.log('DataChannel onopen')
          dispatch(dataChannelOpenStatus(true))
          // 未送信のファイルリストを確認して送信
          sendFileListOnDataChannel(dispatch, getState)
        }
        dataChannel.onclose = () => {
          dispatch(dataChannelOpenStatus(false))
          console.log('DataChannel onclose')
        }
        dataChannel.onerror = () => {
          dispatch(dataChannelOpenStatus(false))
          console.log('DataChannel onerror')
        }
        dataChannel.onmessage = (event) => {
          dataReceive(event, dispatch, getState)
        }
      }
      peerConnection.oniceconnectionstatechange = (event) => {
        console.log('oniceconnectionstatechange', event, peerConnection.iceConnectionState)
        switch (peerConnection.iceConnectionState) {
          case 'closed':
            if (dataChannel) dataChannel.close()
            console.log('peerConnection closed', dataChannel.readyState)
          case 'failed':
            if (dataChannel) dataChannel.close()
            console.log('peerConnection failed', dataChannel.readyState)
          case 'disconnected':
            if (dataChannel) dataChannel.close()
            console.log('peerConnection disconnected', dataChannel.readyState)
          default:
            console.log('peerConnection default', peerConnection.iceConnectionState)
        }
      }
      peerConnection.onicegatheringstatechange = (event) => {
        console.log('onicegatheringstatechange', event, peerConnection.iceConnectionState)
      }
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('onicecandidate')
          getState().sender.socket.emit('send_found_candidate', {
            selfType: 'Sender',
            to: getState().sender.receiverID,
            from: getState().sender.selfID,
            candidate: event.candidate
          })
        } else {
          // event.candidateが空の場合は終了
        }
      }
      await peerConnection.setRemoteDescription(new RTCSessionDescription(obj.sdp))
      let answerSdp = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answerSdp)
      socket.emit('send_answer_sdp', {
        to: getState().sender.receiverID,
        type: 'answer',
        sdp: answerSdp
      })
    })
    socket.on('send_found_candidate', async (obj) => {
      console.log('onicecandidate found')
      await peerConnection.addIceCandidate(new RTCIceCandidate(obj.candidate))
    })
  }
}

export const disconnect = () => {
  return async (dispatch, getState) => {
    if (peerConnection) {
      if (peerConnection.iceConnectionState !== 'closed') {
        peerConnection.close()
        peerConnection = null
      }
    }
  }
}

function dataReceive (event, dispatch, getState) {
  if (typeof(event.data) === 'string') {
    if (JSON.parse(event.data).receiveComplete !== undefined) {
      const receiveComplete = JSON.parse(event.data).receiveComplete
      // 受信完了通知
      console.log('受信完了通知', (receiveComplete ? '成功' : '失敗'))
      // console.timeEnd('sendFileTotal' + receiveComplete.id)
      updateSendFileList(receiveComplete.id, 'receiveComplete', true, dispatch, getState)
      updateSendFileList(receiveComplete.id, 'receiveResult', receiveComplete.result, dispatch, getState)
    }
  }
}

const setSocket = (socket) => ({
  type: prefix + 'SET_SOCKET',
  payload: { socket }
})

const setSelfID = (selfID) => ({
  type: prefix + 'SET_SELF_ID',
  payload: { selfID }
})

const setReceiverID = (receiverID) => ({
  type: prefix + 'SET_RECEIVER_ID',
  payload: { receiverID }
})

const dataChannelOpenStatus = (dataChannelOpenStatus) => ({
  type: prefix + 'DATACHANNEL_OPEN_STATUS',
  payload: { dataChannelOpenStatus }
})

export const sendData = () => {
  return (dispatch, getState) => {
    if (!getState().sender.dataChannelOpenStatus) return console.error('Data Channel not open')
    const sendFileList = Object.assign({}, getState().sender.sendFileList)
    if (Object.keys(sendFileList).length === 0) return console.error('Send file not found')
    // 未送信ファイルのidのみのリストを作成
    const sendList = Object.keys(sendFileList).filter((id) => {
      const file = sendFileList[id]
      // 送信開始済みと削除済みファイルは除外
      if (file.send || file.delete) return false
      return id
    })
    // 未送信ファイルを追加順で送信する
    sendList.reverse().forEach((id) => {
      sendFileData(id, dispatch, getState)
    })
    // if (sendList.length === 0) console.error('送るファイルはありません', sendList)
  }
}

function openSendFile (id, fileInfo, dispatch, getState) {
  if (!getState().sender.dataChannelOpenStatus) {
    return console.error('dataChannel not open')
  }
  // console.time('sendTotal' + id)
  // FileReaderの設定
  let fileReader = new FileReader()
  fileReader.onloadstart = (event) => {
    updateSendFileList(id, 'load', 0, dispatch, getState)
  }
  // fileReader.onabort = (event) => { console.log('fileReader onabort', event) }
  // fileReader.onerror = (event) => { console.log('fileReader onerror', event) }
  fileReader.onloadend = (event) => {
    updateSendFileList(id, 'load', 100, dispatch, getState)
  }
  fileReader.onprogress = (event) => {
    const percent = Math.ceil(event.loaded / event.total * 1000.0) / 10.0
    updateSendFileList(id, 'load', percent, dispatch, getState)
  }
  fileReader.onload = async (event) => {
    updateSendFileList(id, 'load', 100, dispatch, getState)

    let data = new Uint8Array(event.target.result)
    updateSendFileList(id, 'byteLength', data.byteLength, dispatch, getState)
    updateSendFileList(id, 'sendTime', Math.ceil(data.byteLength / packetSize), dispatch, getState)
    updateSendFileList(id, 'rest', data.byteLength % packetSize, dispatch, getState)
    const startFileInfo = {
      start: {
        id: id,
        size: {
          byteLength: data.byteLength,
          sendTime: Math.ceil(data.byteLength / packetSize),
          rest: data.byteLength % packetSize
        },
        // file: {
        //   lastModified: fileInfo.lastModified,
        //   name: fileInfo.name,
        //   size: fileInfo.size,
        //   type: fileInfo.type,
        //   webkitRelativePath: fileInfo.webkitRelativePath
        // }
      }
    }
    console.log('直前ファイル情報送信', startFileInfo, startFileInfo.start.size.sendTime)
    console.time('sendFile' + id)
    dataChannel.send(JSON.stringify(startFileInfo))

    let start = 0
    let sendPacketCount = 0

    // 送信 (レンダリングエンジンが止まる)
    // while (start < data.byteLength) {
    //   if (dataChannel.bufferedAmount === 0) {
    //     let end = start + packetSize

    //     let packetData = data.slice(start, end)

    //     console.log('ファイル送信中')

    //     let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
    //     // [0] は終了フラグ
    //     packet[0] = (end >= data.byteLength ? 1 : 0 )
    //     // idBufferをpacketに追加
    //     packet.set(fileInfo.idBuffer, flagLength)
    //     // dataを追加
    //     packet.set(new Uint8Array(packetData), flagLength + idLength)

    //     // 送信および状態更新
    //     dataChannel.send(packet)
    //     updateSendFileList(id, 'send', Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)

    //     sendPacketCount++
    //     start = end
    //   }
    // }

    // console.log('送信完了')

    // const endFileInfo = {
    //   end: {
    //     id,
    //   }
    // }
    // dataChannel.send(JSON.stringify(endFileInfo))
    // console.timeEnd('sendFile' + id)

    // updateSendFileList(id, 'send', 100, dispatch, getState)

    // 送信2
    start = 0
    sendPacketCount = 0

    function sendPacket () {
      if ((sendPacketCount % 1000) === 0) console.timeStamp('each')
      if (!(start < data.byteLength)) {
        const endFileInfo = {
          end: {
            id,
          }
        }
        dataChannel.send(JSON.stringify(endFileInfo))
        updateSendFileList(id, 'send', 100, dispatch, getState)
        console.timeEnd('sendFile' + id)
        console.log('DataChannelファイル送信完了')
        console.log('setTimeout end')
        return
      }
      if (dataChannel.bufferedAmount === 0) {

        let end = start + packetSize
        let packetData = data.slice(start, end)
        let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
        packet[0] = (end >= data.byteLength ? 1 : 0 )
        packet.set(fileInfo.idBuffer, flagLength)
        packet.set(new Uint8Array(packetData), flagLength + idLength)

        console.log('ファイル送信中')

        // 送信および状態更新
        dataChannel.send(packet)
        updateSendFileList(id, 'send', Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)

        sendPacketCount++
        start = end
      }
      setTimeout(sendPacket)
    }
    sendPacket()
  }

  // ファイル読み込み
  fileReader.readAsArrayBuffer(fileInfo.file)
}

// ファイルを分割して読み込む
function sliceOpenSendFile (id, fileInfo, dispatch, getState) {
  // console.time('sendFileTotal' + id)

  const file = fileInfo.file

  // file.sizeとbyteLengthは同じっぽい(ファイル追加時に取得している)
  // updateSendFileList(id, 'byteLength', fileInfo.size, dispatch, getState)
  // updateSendFileList(id, 'sendTime', Math.ceil(fileInfo.size / packetSize), dispatch, getState)
  // updateSendFileList(id, 'rest', fileInfo.size % packetSize, dispatch, getState)
  const startFileInfo = {
    start: {
      id: id
    }
  }
  console.log('ファイル送信準備')
  // console.time('sendFile' + id)
  dataChannel.send(JSON.stringify(startFileInfo))

  let start = 0
  let sendPacketCount = 0

  function openSend () {
    if (getState().sender.sendFileList[id].delete) {
      console.log('削除されたため中断', id)
      return
    }
    if (!(start < file.size)) {
      const endFileInfo = {
        end: {
          id,
        }
      }
      dataChannel.send(JSON.stringify(endFileInfo))
      updateSendFileList(id, 'send', 100, dispatch, getState)
      // console.timeEnd('sendFile' + id)
      console.log('ファイル送信完了')
      return
    }
    let end = start + packetSize
    const fs = new FileReader()
    fs.onloadend = (event) => {
      if (event.target.readyState == FileReader.DONE) {
        // 送信するpacketの準備
        let packetData = event.target.result
        let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
        packet[0] = (end >= file.size ? 1 : 0)
        packet.set(fileInfo.idBuffer, flagLength)
        packet.set(new Uint8Array(packetData), flagLength + idLength)
        // Chrome待機用(不要になったかも)
        // while (dataChannel.bufferedAmount > 0) {}
        // 送信および状態更新
        dataChannel.send(packet)
        updateSendFileList(id, 'send', Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)
        sendPacketCount++
        start = end
        console.log('ファイル送信中')
        setTimeout(openSend())
      }
    }
    let blob = file.webkitSlice ? file.webkitSlice(start, end) : (file.mozSlice ? file.mozSlice(start, end) : file.slice(start, end))
    fs.readAsArrayBuffer(blob)
  }
  openSend()
}

function sendFileData (id, dispatch, getState) {
  console.log('ファイル送信処理開始')

  // ファイル情報を取得
  const sendFileList = Object.assign({}, getState().sender.sendFileList)

  // 削除されたファイルは何もしない(二重確認)
  if (sendFileList.delete) return false

  console.warn(peerConnection)
  console.warn(dataChannel)

  // 送信方法を選択
  // return openSendFile(id, sendFileList[id], dispatch, getState)
  return sliceOpenSendFile(id, sendFileList[id], dispatch, getState)
}

export const sendFile = () => {
  return async (dispatch, getState) => {
    // console.log('sendFile')
    // let fileReader = new FileReader()
    // fileReader.onloadstart = (event) => { console.log('fileReader onloadstart', event) }
    // fileReader.onabort = (event) => { console.log('fileReader onabort', event) }
    // fileReader.onerror = (event) => { console.log('fileReader onerror', event) }
    // fileReader.onloadend = (event) => { console.log('fileReader onloadend', event) }
    // fileReader.onprogress = (event) => { console.log('fileReader onprogress', event.loaded + '/' + event.total) }
    // fileReader.onload = (event) => {
    //   console.log('DataChannelファイル送信開始', getState().sender.fileList[0])
    //   let data = new Uint8Array(event.target.result)
    //   console.log('バイト数: ' + data.byteLength, '送信回数: ' + Math.ceil(data.byteLength / packetSize), '余り: ' + (data.byteLength % packetSize))
    //   console.log('sendData', data)
    //   const sendInfo = {
    //     size: {
    //       total: data.byteLength,
    //       sendTotal: Math.ceil(data.byteLength / packetSize),
    //       lastSize: data.byteLength % packetSize,
    //     },
    //     file: {
    //       lastModified: getState().sender.fileList[0].lastModified,
    //       name: getState().sender.fileList[0].name,
    //       size: getState().sender.fileList[0].size,
    //       type: getState().sender.fileList[0].type,
    //       webkitRelativePath: getState().sender.fileList[0].webkitRelativePath
    //     }
    //   }

    //   dispatch(setSentDataInfo(sendInfo))
    //   dataChannel.send(JSON.stringify(sendInfo))
    //   console.log('label', dataChannel.label)
    //   console.log('ordered', dataChannel.ordered)
    //   console.log('protocol', dataChannel.protocol)
    //   console.log('id', dataChannel.id)
    //   console.log('readyState', dataChannel.readyState)
    //   console.log('bufferedAmount', dataChannel.bufferedAmount)
    //   console.log('binaryType', dataChannel.binaryType)
    //   console.log('maxPacketLifeType', dataChannel.maxPacketLifeType)
    //   console.log('maxRetransmits', dataChannel.maxRetransmits)
    //   console.log('negotiated', dataChannel.negotiated)
    //   console.log('reliable', dataChannel.reliable)
    //   console.log('stream', dataChannel.stream)

    //   const userAgent = window.navigator.userAgent.toLowerCase()
    //   if(userAgent.indexOf('msie') != -1 || userAgent.indexOf('trident') != -1) {
    //     // Internet Explorer
    //   } else if(userAgent.indexOf('edge') != -1) {
    //     // Edge
    //   } else if(userAgent.indexOf('chrome') != -1) {
    //     // Google Chrome
    //     while (start < data.byteLength) {
    //       if (dataChannel.bufferedAmount === 0) {
    //       // if (dataChannel.bufferedAmount < 10000000) {
    //         let end = start + packetSize
    //         let packetData = data.slice(start, end)
    //         let packet = new Uint8Array(packetData.byteLength + 1)
    //         packet[0] = (end >= data.byteLength ? 1 : 0 )
    //         packet.set(new Uint8Array(packetData), 1)
    //         console.log('Chrome DataChannelファイル送信中', dataChannel.bufferedAmount)
    //         // console.log('DataChannelファイル送信')
    //         dataChannel.send(packet)
    //         start = end
    //         // dispatch(setsendPacketCount(++sendPacketCount))
    //       }
    //     }
    //   } else if(userAgent.indexOf('safari') != -1) {
    //     // Safari
    //   } else if(userAgent.indexOf('firefox') != -1) {
    //     // FireFox
    //     while (start < data.byteLength) {
    //       let end = start + packetSize
    //       let packetData = data.slice(start, end)
    //       let packet = new Uint8Array(packetData.byteLength + 1)
    //       packet[0] = (end >= data.byteLength ? 1 : 0)
    //       packet.set(new Uint8Array(packetData), 1)
    //       console.log('Firefox DataChannelファイル送信中')
    //       // console.log('DataChannelファイル送信')
    //       dataChannel.send(packet)
    //       start = end
    //       // dispatch(setsendPacketCount(++sendPacketCount))
    //     }
    //   } else if(userAgent.indexOf('opera') != -1) {
    //     // Opera
    //   } else {
    //     // undefined
    //   }

    //   console.log('DataChannelファイル送信完了')
    //   // 送信処理リセット
    //   start = 0
    //   sendPacketCount = 0
    // }
    // fileReader.readAsArrayBuffer(getState().sender.fileList[0])
  }
}

// WebWorkerのテスト
// const scriptBlob = new Blob(['(',
// function () {
//   console.log('[WebWorker] WebWorker standby')
//   onmessage = (event) => {
//     const data = event.data[0]
//     const dataChannel = event.data[1]
//     const fileInfo = event.data[2]

//     const packetSize = 1024 * 16 - 1
//     let start = 0
//     let sendPacketCount = 0
//     let percent

//     while (start < data.byteLength) {
//       if (dataChannel.bufferedAmount === 0) {
//         // console.log('DataChannelファイル送信中', dataChannel.bufferedAmount)
//         let end = start + packetSize
//         let packetData = data.slice(start, end)
//         let packet = new Uint8Array(packetData.byteLength + 1)
//         packet[0] = (end >= data.byteLength ? 1 : 0 )
//         packet.set(new Uint8Array(packetData), 1)

//         // 送信および状態更新
//         if (getState().sender.dataChannelOpenStatus) dataChannel.send(packet)
//         percent = Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0
//         console.log('[WebWorker] ファイル送信中')

//         updateSendFileList(id, 'send', percent, dispatch, getState)
//         postMessage(percent)

//         sendPacketCount++
//         start = end
//       }
//     }

//     updateSendFileList(id, 'send', 100, dispatch, getState)
//     postMessage({object: 'done'})
//   }
// }.toString(),
// ')()'
// ], { type: 'application/javascript' })

  // const worker = new Worker(window.URL.createObjectURL(scriptBlob))

  // console.log('worker', worker)

  // const data = getState().sender.sendFileStorage[id]
  // worker.postMessage([data, dataChannel, fileInfo])
  // worker.onmessage = (e, id, dispatch, getState) => {
  //   updateSendFileList(id, 'send', e.data, dispatch, getState)
  //   console.log('worker runs', e)
  // }

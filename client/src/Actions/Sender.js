// import socketio from 'socket.io-client'

import { randomString, stringToBuffer, bufferToString } from '../Library/Library'

import { sendDataChannel, dataChannelBufferedAmount } from './Connection'

const prefix = 'SENDER_'

// 定数
// ファイルIDは16文字
let idLength = 16
// 終了フラグサイズ
let flagLength = 1
// 1つのpacketは16KB以下にする
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
          err: false,

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
        to: 'receiver',
        delete: {
          id: id,
        }
      }
      sendDataChannel(JSON.stringify(deleteFileInfo))
    }
    // console.log('ファイル削除')
    updateSendFileList(id, 'delete', true, dispatch, getState)
  }
}

export const errorFile = (id) => {
  return (dispatch, getState) => {
    const errorFileList = getState().sender.sendFileList[id]
    // preSendInfoを送信済みの場合はReceiverに削除を通知する
    if (errorFileList.preSendInfo === true) {
      const errorFileInfo = {
        to: 'receiver',
        err: {
          id: id,
        }
      }
      sendDataChannel(JSON.stringify(errorFileInfo))
    }
    // console.log('ファイル削除')
    updateSendFileList(id, 'err', true, dispatch, getState)
  }
}

export const dataChannelOnOpen = (dispatch, getState) => {
  sendFileListOnDataChannel(dispatch, getState)
  return
}

function sendFileListOnDataChannel (dispatch, getState) {
  if (getState().connection.dataChannelOpenStatus) {
    const sendFileList = getState().sender.sendFileList
    Object.keys(sendFileList).reverse().forEach((num) => {
      const id = sendFileList[num].id
      if (!sendFileList[num].preSendInfo) {
        const sendFileInfo = {
          to: 'receiver',
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
        // console.log('preSendInfo')
        sendDataChannel(JSON.stringify(sendFileInfo))
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

export function senderReceiveData (event, dispatch, getState) {
  if (typeof(event.data) === 'string') {
    if (JSON.parse(event.data).receiveComplete !== undefined) {
      const receiveComplete = JSON.parse(event.data).receiveComplete
      // 受信完了通知
      // console.log('受信完了通知', (receiveComplete ? '成功' : '失敗'))
      // console.timeEnd('sendFileTotal' + receiveComplete.id)
      updateSendFileList(receiveComplete.id, 'receiveComplete', true, dispatch, getState)
      updateSendFileList(receiveComplete.id, 'receiveResult', receiveComplete.result, dispatch, getState)
    }
  }
}

export const sendData = () => {
  return (dispatch, getState) => {
    if (!getState().connection.dataChannelOpenStatus) return // console.error('Data Channel not open')
    const sendFileList = Object.assign({}, getState().sender.sendFileList)
    if (Object.keys(sendFileList).length === 0) return // console.error('Send file not found')
    // 未送信ファイルのidのみのリストを作成
    const sendList = Object.keys(sendFileList).filter((id) => {
      const file = sendFileList[id]
      // 送信開始済みと削除済みファイルは除外
      if (!(file.send === false) || file.delete) return false
      return id
    })
    // 未送信ファイルを追加順で送信する
    sendList.reverse().forEach((id) => {
      updateSendFileList(id, 'send', 0, dispatch, getState)
      sendFileData(id, dispatch, getState)
    })
    // if (sendList.length === 0) console.error('送るファイルはありません', sendList)
  }
}

function sendFileData (id, dispatch, getState) {
  // console.log('ファイル送信処理開始', id)

  // ファイル情報を取得
  const sendFileList = Object.assign({}, getState().sender.sendFileList)

  // 削除されたファイルは何もしない(二重確認)
  if (sendFileList.delete) return false

  // 送信方法を選択
  return openSendFile(id, sendFileList[id], dispatch, getState)
  // return sliceOpenSendFile(id, sendFileList[id], dispatch, getState)
}

// // ファイルを分割して読み込む
// function sliceOpenSendFile (id, fileInfo, dispatch, getState) {
//   // console.time('sendFileTotal' + id)

//   const file = fileInfo.file

//   // file.sizeとbyteLengthは同じっぽい(ファイル追加時に取得している)
//   // updateSendFileList(id, 'byteLength', fileInfo.size, dispatch, getState)
//   // updateSendFileList(id, 'sendTime', Math.ceil(fileInfo.size / packetSize), dispatch, getState)
//   // updateSendFileList(id, 'rest', fileInfo.size % packetSize, dispatch, getState)
//   const startFileInfo = {
//     to: 'receiver',
//     start: {
//       id: id
//     }
//   }
//   // console.log('ファイル送信準備')
//   // console.time('sendFile(' + id + ')')
//   sendDataChannel(JSON.stringify(startFileInfo))

//   let start = 0
//   let sendPacketCount = 0

//   function openSend () {
//     if (getState().sender.sendFileList[id].delete) {
//       // console.log('削除されたため中断', id)
//       return
//     }
//     if (!(start < file.size)) {
//       const endFileInfo = {
//         to: 'receiver',
//         end: {
//           id,
//         }
//       }
//       sendDataChannel(JSON.stringify(endFileInfo))
//       updateSendFileList(id, 'send', 100, dispatch, getState)
//       // console.timeEnd('sendFile(' + id + ')')
//       // console.log('ファイル送信完了')
//       return
//     }
//     let end = start + packetSize
//     const fs = new FileReader()
//     fs.onloadend = (event) => {
//       if (event.target.readyState == FileReader.DONE) {
//         // 送信するpacketの準備
//         let packetData = event.target.result
//         let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
//         packet[0] = (end >= file.size ? 1 : 0)
//         packet.set(fileInfo.idBuffer, flagLength)
//         packet.set(new Uint8Array(packetData), flagLength + idLength)
//         // Chrome待機用(不要になったかも)
//         while (dataChannelBufferedAmount() > 0) {}
//         // 送信および状態更新
//         sendDataChannel(packet)
//         updateSendFileList(id, 'send', Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)
//         updateSendFileList(id, 'sendPacketCount', sendPacketCount+1, dispatch, getState)        
//         sendPacketCount++
//         start = end
//         // console.log('データ送信中')
//         setTimeout(openSend())
//       }
//     }
//     let blob = file.webkitSlice ? file.webkitSlice(start, end) : (file.mozSlice ? file.mozSlice(start, end) : file.slice(start, end))
//     fs.readAsArrayBuffer(blob)
//   }
//   openSend()
// }

function openSendFile (id, fileInfo, dispatch, getState) {
  if (!getState().connection.dataChannelOpenStatus) {
    return console.error('dataChannel not open')
  }
  // console.time('sendTotal' + id)
  // FileReaderの設定
  let fileReader = new FileReader()
  fileReader.onloadstart = (event) => {
    updateSendFileList(id, 'load', 0, dispatch, getState)
  }
  fileReader.onabort = (event) => { console.log('fileReader onabort', event) }
  fileReader.onerror = (event) => {
    console.log('fileReader onerror', event)
    dispatch(errorFile(id))
  }
  fileReader.onloadend = (event) => {
    updateSendFileList(id, 'load', 100, dispatch, getState)
  }
  fileReader.onprogress = (event) => {
    // console.log('load', event.loaded)
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
        to: 'receiver',
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
    sendDataChannel(JSON.stringify(startFileInfo))

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
    //     sendDataChannel(packet)
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
    // sendDataChannel(JSON.stringify(endFileInfo))
    // console.timeEnd('sendFile' + id)

    // updateSendFileList(id, 'send', 100, dispatch, getState)

    // 送信2
    function sendPacket () {
      if (!(start < data.byteLength)) {
        const endFileInfo = {
          to: 'receiver',
          end: {
            id,
          }
        }
        sendDataChannel(JSON.stringify(endFileInfo))
        updateSendFileList(id, 'send', 100, dispatch, getState)
        return
      }
      if (dataChannelBufferedAmount() === 0) {
        let end = start + packetSize
        let packetData = data.slice(start, end)
        let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
        packet[0] = (end >= data.byteLength ? 1 : 0 )
        packet.set(fileInfo.idBuffer, flagLength)
        packet.set(new Uint8Array(packetData), flagLength + idLength)

        // 送信および状態更新
        sendDataChannel(packet)
        updateSendFileList(id, 'send', Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)
        updateSendFileList(id, 'sendPacketCount', sendPacketCount+1, dispatch, getState)
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
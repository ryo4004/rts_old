import socketio from 'socket.io-client'
import uniqid from 'uniqid'

import { randomString, stringToBuffer, bufferToString } from '../Library/Library'

const prefix = 'SENDER_'

let peerConnection
let dataChannel

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
          idBuffer: stringToBuffer(id),
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

          // Sender用プロパティ(変更不可)
          sendPacketCount: 0,

          // Receiver用プロパティ(変更不可)
          // receive: false, (ファイルリスト送信時に追加する)
          // preReceiveInfo: false, (ファイルリスト送信時に追加する)
          // receivePacketCount: 0, (ファイルリスト送信時に追加する)

          // ファイルサイズ情報
          byteLength: undefined,
          sendTime: undefined,
          rest: undefined,

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

      // dataChannelが開いていたらファイルリスト情報を送信する
      sendFileListOnDataChannel(id, sendFileList, dispatch, getState)
    })
  }
}

function sendFileListOnDataChannel (id, sendFileList, dispatch, getState) {
  if (getState().sender.dataChannelOpenStatus) {
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
    delete sendFileInfo.add[id].file
    sendFileInfo.add[id].receive = false
    sendFileInfo.add[id].preReceiveInfo = false
    sendFileInfo.add[id].receivePacketCount = 0
    console.warn('preSendInfo', sendFileInfo, sendFileList[id])
    dataChannel.send(JSON.stringify(sendFileInfo))
    updateSendFileList(id, 'preSendInfo', true, dispatch, getState)
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

// const setSendFileStorage = (sendFileStorage) => ({
//   type: prefix + 'SET_SEND_FILE_STORAGE',
//   payload: { sendFileStorage }
// })

export const connectSocket = () => {
  return async (dispatch, getState) => {
    dispatch(loading(true))
    // Socket接続
    const socket = await socketio.connect('https://192.168.1.254:3000/', {secure: true})
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
      console.warn('Receiver id', obj)
      dispatch(setReceiverID(obj.from))
    })
    // 受信
    socket.on('send_offer_sdp', async (obj) => {
      console.warn('OfferSdp', obj)

      // PeerConnection作成
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
        iceTransportPolicy: 'all'
      })
      peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel
        dataChannel.onopen = () => {
          dispatch(dataChannelOpenStatus(true))
          console.warn('DataChannel onopen')
        }
        dataChannel.onclose = () => {
          dispatch(dataChannelOpenStatus(false))
          console.warn('DataChannel onclose')
        }
        dataChannel.onerror = () => {
          dispatch(dataChannelOpenStatus(false))
          console.warn('DataChannel onerror')
        }
        dataChannel.onmessage = (event) => { console.log('DataChannel受信', event) }
      }
      peerConnection.oniceconnectionstatechange = (event) => { console.log('oniceconnectionstatechange', event) }
      peerConnection.onicegatheringstatechange = (event) => { console.log('onicegatheringstatechange', event) }
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.warn('経路発見')
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
      console.warn('経路受信')
      await peerConnection.addIceCandidate(new RTCIceCandidate(obj.candidate))
    })
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
    console.log('DataChannel送信')
    if (!getState().sender.dataChannelOpenStatus) return console.error('Data Channel not open')
    const sendFileList = Object.assign({}, getState().sender.sendFileList)
    if (Object.keys(sendFileList).length === 0) return console.error('Send file not found')

    // 未送信ファイルのidのみのリストを作成
    const sendList = Object.keys(sendFileList).filter((id) => {
      const file = sendFileList[id]
      if (file.send) return false
      return id
    })
    // 未送信ファイルを追加順で送信する
    sendList.reverse().forEach((id) => {
      sendFileData(id, dispatch, getState)
    })

    if (sendList.length === 0) {
      console.log('送るファイルはありません', sendList)
    } else {
      console.log('ファイル送信しました', sendList)
      // sendList.forEach((id) => {
      //   console.log(getState().sender.sendFileList[id].name)
      // })
    }
  }
}

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

function openSendFile (id, fileInfo, dispatch, getState) {
  if (!getState().sender.dataChannelOpenStatus) {
    return console.error('dataChannel error')
  }

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
    // dispatch(setSendFileInfo(startFileInfo))

    let start = 0
    let sendPacketCount = 0

    // 送信
    // while (start < data.byteLength) {
    //   if (dataChannel.bufferedAmount === 0) {
    //     let end = start + packetSize

    //     let packetData = data.slice(start, end)

    //     console.log('ファイル送信中', id, end - start, packetData.length, start, end)

    //     let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
    //     // [0] は終了フラグ
    //     packet[0] = (end >= data.byteLength ? 1 : 0 )
    //     // idBufferをpacketに追加
    //     packet.set(fileInfo.idBuffer, flagLength)
    //     // dataを追加
    //     packet.set(new Uint8Array(packetData), flagLength + idLength)

    //     // 送信および状態更新
    //     // dataChannel.send(packet)
    //     updateSendFileList(id, 'send', Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)

    //     sendPacketCount++
    //     start = end
    //   }
    // }

    // const endFileInfo = {
    //   end: {
    //     id,
    //   }
    // }
    // dataChannel.send(JSON.stringify(endFileInfo))

    // updateSendFileList(id, 'send', 100, dispatch, getState)

    start = 0
    sendPacketCount = 0

    // await setTimeout(function timeout () {
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
        return console.log('setTimeout end')
      }
      if (dataChannel.bufferedAmount === 0) {
        
        let end = start + packetSize
        let packetData = data.slice(start, end)
        let packet = new Uint8Array(packetData.byteLength + flagLength + idLength)
        packet[0] = (end >= data.byteLength ? 1 : 0 )
        packet.set(fileInfo.idBuffer, flagLength)
        packet.set(new Uint8Array(packetData), flagLength + idLength)

        // console.log('ファイル送信中2', id, sendPacketCount, data.byteLength, start, end)
        console.log('ファイル送信中2')

        // 送信および状態更新
        dataChannel.send(packet)
        updateSendFileList(id, 'send', Math.ceil(sendPacketCount / fileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)
        // console.log('ファイル送信中2', id, Math.ceil(sendPacketCount / fileInfo.sendTime * 100.0))

        sendPacketCount++
        start = end
      }
      setTimeout(sendPacket)
      // sendPacket()
    }
    // }, 1)
    sendPacket()

    // 送信処理リセット
    // start = 0
    // sendPacketCount = 0
  }

  // ファイル読み込み
  fileReader.readAsArrayBuffer(fileInfo.file)

  // console.log('id', stringToBuffer(id),stringToBuffer(id).byteLength, id, bufferToString(stringToBuffer(id)))
  // console.log([].map.call(id, (c) => c.charCodeAt(0)), '漢'.charCodeAt(0))
}

function sendFileData (id, dispatch, getState) {
  console.log('データ送信処理開始', id)
  // ファイル情報を送信
  const sendFileList = Object.assign({}, getState().sender.sendFileList)

  // ファイル読み込み
  console.warn('ファイル読み込み', sendFileList)

  return openSendFile(id, sendFileList[id], dispatch, getState)
  // const fileInfo = sendFileList[id]
  // const sendInfo = {
  //   sendFileInfo: {
  //     id: id,
  //     size: {
  //       byteLength: fileInfo.byteLength,
  //       sendTime: fileInfo.sendTime,
  //       rest: fileInfo.rest
  //     },
  //     file: {
  //       lastModified: fileInfo.lastModified,
  //       name: fileInfo.name,
  //       size: fileInfo.size,
  //       type: fileInfo.type,
  //       webkitRelativePath: fileInfo.webkitRelativePath
  //     }
  //   }
  // }
  // dispatch(setSendFileInfo(sendInfo))
  // dataChannel.send(JSON.stringify(sendInfo))

  // const worker = new Worker(window.URL.createObjectURL(scriptBlob))

  // console.warn('worker', worker)

  // const data = getState().sender.sendFileStorage[id]
  // worker.postMessage([data, dataChannel, fileInfo])
  // worker.onmessage = (e, id, dispatch, getState) => {
  //   updateSendFileList(id, 'send', e.data, dispatch, getState)
  //   console.log('worker runs', e)
  // }

  // ファイルをpacketとして送信
  // let percent


  // const data = getState().sender.sendFileStorage[id]

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
    //   console.warn('DataChannelファイル送信開始', getState().sender.fileList[0])
    //   let data = new Uint8Array(event.target.result)
    //   console.log('バイト数: ' + data.byteLength, '送信回数: ' + Math.ceil(data.byteLength / packetSize), '余り: ' + (data.byteLength % packetSize))
    //   console.warn('sendData', data)
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
    //   console.warn('label', dataChannel.label)
    //   console.warn('ordered', dataChannel.ordered)
    //   console.warn('protocol', dataChannel.protocol)
    //   console.warn('id', dataChannel.id)
    //   console.warn('readyState', dataChannel.readyState)
    //   console.warn('bufferedAmount', dataChannel.bufferedAmount)
    //   console.warn('binaryType', dataChannel.binaryType)
    //   console.warn('maxPacketLifeType', dataChannel.maxPacketLifeType)
    //   console.warn('maxRetransmits', dataChannel.maxRetransmits)
    //   console.warn('negotiated', dataChannel.negotiated)
    //   console.warn('reliable', dataChannel.reliable)
    //   console.warn('stream', dataChannel.stream)

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

// const setSendFileInfo = (sendFileInfo) => ({
//   type: prefix + 'SET_SEND_FILE_INFO',
//   payload: { sendFileInfo }
// })

// const setSendPacketCount = (sendPacketCount) => ({
//   type: prefix + 'SET_SEND_PACKET_COUNT',
//   payload: { sendPacketCount }
// })

import socketio from 'socket.io-client'

const prefix = 'SENDER_'

let peerConnection
let dataChannel

let packetSize = 1024 * 16 - 1
let start = 0
let sendPacketCount = 0

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

function randomString () {
  const character = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (var i=0; i<8; i++) { id += character[Math.floor(Math.random()*character.length)] }
  return (new Date().getTime()) + id
}

function updateSendFileList (property, value, id, dispatch, getState) {
  // JSON.parse(JSON.stringify())は使わない
  const sendFileList = {}
  Object.assign(sendFileList, getState().sender.sendFileList)
  sendFileList[id][property] = value
  dispatch(setSendFileList(sendFileList))
}

function openFile (id, file, dispatch, getState) {
  let fileReader = new FileReader()
  fileReader.onloadstart = (event) => {
    updateSendFileList('load', 0, id, dispatch, getState)
  }
  // fileReader.onabort = (event) => { console.log('fileReader onabort', event) }
  // fileReader.onerror = (event) => { console.log('fileReader onerror', event) }
  fileReader.onloadend = (event) => {
    updateSendFileList('load', 100, id, dispatch, getState)
  }
  fileReader.onprogress = (event) => {
    const percent = Math.ceil(event.loaded / event.total * 1000.0) / 10.0
    updateSendFileList('load', percent, id, dispatch, getState)
  }
  fileReader.onload = (event) => {
    let data = new Uint8Array(event.target.result)
    updateSendFileList('byteLength', data.byteLength, id, dispatch, getState)
    updateSendFileList('sendTime', Math.ceil(data.byteLength / packetSize), id, dispatch, getState)
    updateSendFileList('rest', data.byteLength % packetSize, id, dispatch, getState)
    let sendFileStorage = {}
    Object.assign(sendFileStorage, getState().sender.sendFileStorage)
    sendFileStorage[id] = data
    dispatch(setSendFileStorage(sendFileStorage))
  }
  fileReader.readAsArrayBuffer(file)
}

export const addFile = (fileList) => {
  return async (dispatch, getState) => {
    dispatch(setFileList(fileList))
    Object.keys(fileList).forEach((num) => {
      // ファイルごとにid生成
      const id = randomString()
      // sendFileListに追加する
      let sendFileList = {
        [id]: {
          id: id,
          timestamp: (new Date()).getTime(),

          // Sender用プロパティ(変更不可)
          // 読み込み状態
          load: false,
          // receiverへfileInfo送信フラグ
          preSendInfo: false,
          // ファイル送信フラグ
          send: false,

          // Receiver用プロパティ(変更不可)
          // receive: false, (ファイルリスト送信時に追加する)
          
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

          // file object(これいらないのでは この後参照しているのか確認する)
          // file: fileList[num]
        }
      }
      Object.assign(sendFileList, getState().sender.sendFileList)
      dispatch(setSendFileList(sendFileList))
      openFile(id, fileList[num], dispatch, getState)

      // dataChannelが開いていたらファイルリスト情報を送信する
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
        sendFileInfo.add[id].receive = false
        console.warn('preSendInfo', sendFileInfo, sendFileList[id])
        dataChannel.send(JSON.stringify(sendFileInfo))
        updateSendFileList('preSendInfo', true, id, dispatch, getState)
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

const setSendFileStorage = (sendFileStorage) => ({
  type: prefix + 'SET_SEND_FILE_STORAGE',
  payload: { sendFileStorage }
})

export const connectSocket = () => {
  return async (dispatch, getState) => {
    dispatch(loading(true))
    // Socket接続
    const socket = await socketio.connect('https://192.168.1.254:3000/', {secure: true})
    // const socket = socketio.connect('https://cast.winds-n.com, {secure: true})
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
          console.warn('DataChannel Standby')
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
  return async (dispatch, getState) => {
    console.log('DataChannel送信')
    if (!getState().sender.dataChannelOpenStatus) return console.error('Data Channel not open')
    const sendFileList = Object.assign(getState().sender.sendFileList)
    if (Object.keys(sendFileList).length === 0) return console.error('Send file not found')

    // const sendFileInfo = Object.assign({}, getState().sender.sendFileList)

    // const sendFileListInfo = Object.keys(sendFileInfo).map((id, i) => {
    //   const each = sendFileList[id]
    //   return {id: each.id, send: each.send, name: each.name, size: each.size}
    // })

    // 未送信ファイルのidのみのリストを作成
    const sendList = Object.keys(sendFileList).filter((id) => {
      const file = sendFileList[id]
      if (file.send || file.load !== 100) return false
      return id
    })
    sendList.reverse().forEach((id) => {
      sendFileData(id, dispatch, getState)
    })
  }
}

function sendFileData (id, dispatch, getState) {
  console.log('データ送信処理開始', id)
  const file = getState().sender.sendFileList[id]
  const data = getState().sender.sendFileStorage[id]
  const sendInfo = {
    sendFileInfo: {
      id: id,
      size: {
        byteLength: file.byteLength,
        sendTime: file.sendTime,
        rest: file.rest
      },
      file: {
        lastModified: file.lastModified,
        name: file.name,
        size: file.size,
        type: file.type,
        webkitRelativePath: file.webkitRelativePath
      }
    }
  }
  dispatch(setSendFileInfo(sendInfo))
  dataChannel.send(JSON.stringify(sendInfo))

  while (start < data.byteLength) {
    if (dataChannel.bufferedAmount === 0) {
    // if (dataChannel.bufferedAmount < 10000000) {
      let end = start + packetSize
      let packetData = data.slice(start, end)
      let packet = new Uint8Array(packetData.byteLength + 1)
      packet[0] = (end >= data.byteLength ? 1 : 0 )
      packet.set(new Uint8Array(packetData), 1)
      console.log('Chrome DataChannelファイル送信中', dataChannel.bufferedAmount)
      // console.log('DataChannelファイル送信')
      dataChannel.send(packet)
      start = end
      dispatch(setSendPacketCount(++sendPacketCount))
    }
  }

  console.log('DataChannelファイル送信完了')
  // 送信処理リセット
  start = 0
  sendPacketCount = 0
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

const setSendFileInfo = (sendFileInfo) => ({
  type: prefix + 'SET_SEND_FILE_INFO',
  payload: { sendFileInfo }
})

const setSendPacketCount = (sendPacketCount) => ({
  type: prefix + 'SET_SEND_PACKET_COUNT',
  payload: { sendPacketCount }
})

import socketio from 'socket.io-client'

import { bufferToString } from '../Library/Library'
const prefix = 'RECEIVER_'

let peerConnection
let dataChannel

// 定数
// ファイルIDは16文字
let idLength = 16
// 終了フラグサイズ
let flagLength = 1
let packetSize = 1024 * 16 - flagLength - idLength

// // // IndexedDB
// let db = null
// const dbName = 'storageDB'

// const dbRequest = indexedDB.open(dbName)
// dbRequest.onupgradeneeded = function(event){
//   //onupgradeneededは、DBのバージョン更新(DBの新規作成も含む)時のみ実行
//   console.log('db upgrade', event)
//   // db = event.target.result
//   // const objectStore = db.createObjectStore('data', { keyPath: 'id'})
//   // console.log('objectStore', objectStore)
//   // objectStore.createIndex("id", "id", { unique: true })
//   // objectStore.createIndex("name", "name", { unique: false })
//   // objectStore.transaction.oncomplete = function(event) {
//   //   // 新たに作成した objectStore に値を保存します。
//   //   const customerObjectStore = db.transaction("name", "readwrite").objectStore("name");
//   //   customerObjectStore.add(insertData)
//   // };
// }
// dbRequest.onsuccess = function(event){
//   //onupgradeneededの後に実行。更新がない場合はこれだけ実行
//   console.log('db open success', event)
//   db = event.target.result
//   // 接続を解除する
//   // db.close()
// }
// dbRequest.onerror = function(event){
//   // 接続に失敗
//   console.log('db open error', event);
// }


// dbRequest.onsuccess = function(event){
//   var db = event.target.result
//   var trans = db.transaction(storeName, 'readwrite')
//   var store = trans.objectStore(storeName)
//   var putReq = store.put(insertData)

//   putReq.onsuccess = function(){
//     console.log('put data success');
//   }

//   trans.oncomplete = function(){
//   // トランザクション完了時(putReq.onsuccessの後)に実行
//     console.log('transaction complete');
//   }
// }

const loading = (loading) => ({
  type: prefix + 'LOADING',
  payload: { loading }
})

export const connectSocket = (senderID) => {
  return async (dispatch, getState) => {
    dispatch(loading(true))
    dispatch(setSenderID(senderID))
    // Socket接続
    const socket = await socketio.connect('https://' + location.host + '/', {secure: true})
    // const socket = socketio.connect('https://rts.zatsuzen.com', {secure: true})
    socket.on('connect', () => {
      dispatch(setSocket(socket))
    })
    // connection_complete で自分のIDを取得
    socket.on('connection_complete', async (obj) => {
      dispatch(loading(false))
      dispatch(setSelfID(obj.id))
      // senderにRequestを送る(IDを通知)
      socket.emit('request_to_sender', {
        from: obj.id,
        to: senderID
      })

      // peerConnectionを作成
      connectPeerConnection(socket, obj, dispatch, getState)

    })
    // 受信
    socket.on('send_answer_sdp', async (obj) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(obj.sdp))
    })
    // 受信
    socket.on('send_found_candidate', async (obj) => {
      console.log('onicecandidate found')
      await peerConnection.addIceCandidate(new RTCIceCandidate(obj.candidate))
    })
    dispatch(setSocket(socket))
  }
}

async function connectPeerConnection (socket, obj, dispatch, getState) {
  const senderID = getState().receiver.senderID
  // PeerConnection作成
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
    iceTransportPolicy: 'all'
  })
  dataChannel = peerConnection.createDataChannel(
    'dataChannel',
    {
      ordered: true
    }
  )
  dataChannel.onopen = () => {
    dispatch(dataChannelOpenStatus(true))
    console.log('DataChannel onopen')
  }
  dataChannel.onclose = () => {
    dispatch(dataChannelOpenStatus(false))
    console.log('DataChannel onclose')
  }
  dataChannel.onerror = () => {
    dispatch(dataChannelOpenStatus(false))
    console.log('DataChannel onerror')
  }

  // 受信データ形式を明示(ブラウザ間差異のため)
  dataChannel.binaryType = 'arraybuffer'

  // console.log('label', dataChannel.label)
  // console.log('ordered', dataChannel.ordered)
  // console.log('protocol', dataChannel.protocol)
  // console.log('id', dataChannel.id)
  // console.log('readyState', dataChannel.readyState)
  // console.log('bufferedAmount', dataChannel.bufferedAmount)
  // console.log('binaryType', dataChannel.binaryType)
  // console.log('maxPacketLifeType', dataChannel.maxPacketLifeType)
  // console.log('maxRetransmits', dataChannel.maxRetransmits)
  // console.log('negotiated', dataChannel.negotiated)
  // console.log('reliable', dataChannel.reliable)
  // console.log('stream', dataChannel.stream)

  // 受信時の処理
  dataChannel.onmessage = (event) => {
    dataReceive(event, dispatch, getState)
  }
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('onicecandidate')
      socket.emit('send_found_candidate', {
        selfType: 'Receiver',
        to: senderID,
        from: obj.id,
        candidate: event.candidate
      })
    } else {
      // event.candidateが空の場合は終了
    }
  }
  let offerSdp = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offerSdp)

  // senderにRequestを送る
  socket.emit('send_offer_sdp', {
    to: senderID,
    type: 'offer',
    sdp: offerSdp
  })
}

const setReceiveFileList = (receiveFileList) => ({
  type: prefix + 'SET_RECEIVE_FILE_LIST',
  payload: { receiveFileList }
})

function updateReceiveFileList (id, property, value, dispatch, getState) {
  // JSON.parse(JSON.stringify())は使わない
  const receiveFileList = {}
  Object.assign(receiveFileList, getState().receiver.receiveFileList)
  receiveFileList[id][property] = value
  dispatch(setReceiveFileList(receiveFileList))
}

function updateReceiveFileInfo (property, value, dispatch, getState) {
  // JSON.parse(JSON.stringify())は使わない
  const receiveFileList = {}
  Object.assign(receiveFileList, getState().sender.receiveFileList)
  receiveFileList[id][property] = value
  dispatch(setReceiveFileList(receiveFileList))
}

function resetReceiveFileStorage (id, dispatch, getState) {
  const receiveFileStorage = {}
  receiveFileStorage[id] = { packets: [] }
  Object.assign(receiveFileStorage, getState().receiver.receiveFileStorage)
  dispatch(setReceiveFileStorage(receiveFileStorage))
}


function updateReceiveFileStorage (id, value, dispatch, getState) {
  // JSON.parse(JSON.stringify())は使わない
  const receiveFileStorage = {}
  Object.assign(receiveFileStorage, getState().receiver.receiveFileStorage)
  receiveFileStorage[id].packets.push(value)
  dispatch(setReceiveFileStorage(receiveFileStorage))
}

function createReceiveFile (id, dispatch, getState) {

  const receiveFileInfo = getState().receiver.receiveFileList[id]
  const packets = getState().receiver.receiveFileStorage[id].packets

  const receiveResult = receiveFileInfo.receivePacketCount === receiveFileInfo.sendTime ? true : false
  updateReceiveFileList(id, 'receiveComplete', true, dispatch, getState)
  updateReceiveFileList(id, 'receiveResult', receiveResult, dispatch, getState)

  // 受信完了通知を送る
  let receiveComplete = {
    receiveComplete: {
      id: id,
      result: receiveResult
    }
  }
  dataChannel.send(JSON.stringify(receiveComplete))

  console.log('受信完了')
  receiveFileInfo.receivePacketCount === receiveFileInfo.sendTime ? console.log('送信回数一致') : console.log('送信回数不一致')

  // const reducer = (accumulator, currentValue) => accumulator + currentValue
  // let length = packets.reduce((accumulator, currentValue) => {
  //   return accumulator + currentValue.byteLength - flagLength - idLength
  // }, 0)
  // let data = new Uint8Array(length)
  // let pos = 0
  // packets.forEach((packet) => {
  //   data.set(packet.slice(flagLength + idLength), pos)
  //   pos += packet.length - flagLength - idLength
  // })

  // // IndexedDB (よくわからなくて使うのやめた)
  // let db
  // const dbName = id

  // const dbRequest = indexedDB.open(dbName)
  // dbRequest.onupgradeneeded = function(event){
  //   console.log('db upgrade', event)
  //   // db = event.target.result
  //   const objectStore = db.createObjectStore(id, { keyPath: 'number'})
  //   objectStore.oncomplete = function() {
  //     packets.forEach((packet, i) => {
  //       const transaction = db.transaction([id], 'readwrite')
  //       transaction.oncomplete = function() { console.log('complete') }
  //       transaction.onerror = function(err) { console.log('error', err) }
  //       const store = transaction.objectStore(id)
  //       const req = store.put({number: i, data: packet, timeStamp: Date.now()})
  //     })
  //   }
  // }
  // dbRequest.onsuccess = function(event){
  //   console.log('db open success', event)
  //   db = event.target.result
  //   // 接続を解除する
  //   // db.close()
  // }
  // dbRequest.onerror = function(event){
  //   // 接続に失敗
  //   console.log('db open error', event);
  // }

  let fileArray = []

  packets.forEach((packet, i) => {
    fileArray.push(packet.slice(flagLength + idLength))
  })

  // console.log(packets, fileArray)

  // FileSystemは非推奨らしい
  // window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem
  // window.requestFileSystem(window.TEMPORARY, receiveFileInfo.size, (fs) => {
  //   fs.root.getFile(receiveFileInfo.name, {create: true, exclusive: true}, (fileEntry) => {
  //     console.log(fileEntry)
  //   }, (error) => {
  //     console.log('error init', error)
  //   })
  // }, (error) => {
  //   console.log('error', error)
  // })

  // const blob = new Blob([data], {type: getState().receiver.receiveFileInfo.file.type})
  // const url = window.URL.createObjectURL(blob)

  const file = new File(fileArray, receiveFileInfo.name, {
    type: receiveFileInfo.type,
    lastModified: receiveFileInfo.lastModified
  })

  const receiveFileUrlList = { [id]: window.URL.createObjectURL(file) }
  Object.assign(receiveFileUrlList, getState().receiver.receiveFileUrlList)
  dispatch(setReceiveFileUrlList(receiveFileUrlList))

  // 受信データ一時置き場をリセットする
  resetReceiveFileStorage(id, dispatch, getState)
  // console.timeEnd('receiveTotal' + id)
}

// データ受信
function dataReceive (event, dispatch, getState) {
  // console.log('DataChannel受信', event)
  if (typeof(event.data) === 'string') {
    // オブジェクトのプロパティによって処理判定
    if (JSON.parse(event.data).add !== undefined) {
      // 受信ファイル一覧を取得
      // addプロパティを外す
      const receiveFileList = JSON.parse(event.data).add
      console.log('受信ファイルリストに追加')
      Object.assign(receiveFileList, getState().receiver.receiveFileList)
      dispatch(setReceiveFileList(receiveFileList))
      return
    } else if (JSON.parse(event.data).delete !== undefined) {
      // ファイル削除通知
      // deleteプロパティを外す
      const deleteReceive = JSON.parse(event.data).delete
      updateReceiveFileList(deleteReceive.id, 'delete', true, dispatch, getState)
      resetReceiveFileStorage(deleteReceive.id, dispatch, getState)
      return
    } else if (JSON.parse(event.data).start !== undefined) {
      // ファイル受信開始
      // startプロパティを外す
      const startReceive = JSON.parse(event.data).start
      // console.time('receiveTotal' + startReceive.id)
      // console.time('receiveFile' + startReceive.id)
      console.log('ファイル受信開始')
      resetReceiveFileStorage(startReceive.id, dispatch, getState)
      // これはもう受信済み
      // updateReceiveFileList(startReceive.id, 'byteLength', startReceive.size.byteLength, dispatch, getState)
      // updateReceiveFileList(startReceive.id, 'rest', startReceive.size.rest, dispatch, getState)
      // updateReceiveFileList(startReceive.id, 'sendTime', startReceive.size.sendTime, dispatch, getState)
      updateReceiveFileList(startReceive.id, 'preReceiveInfo', true, dispatch, getState)

      // receiveFileInfoは上書き
      return // dispatch(setReceiveFileInfo(receiveData))
    } else if (JSON.parse(event.data).end !== undefined) {
      // ファイル受信完了
      // endプロパティを外す
      const endReceive = JSON.parse(event.data).end
      // console.timeEnd('receiveFile' + endReceive.id)
      console.log('ファイル受信完了')
      createReceiveFile(endReceive.id, dispatch, getState)
      updateReceiveFileList(endReceive.id, 'receive', 100, dispatch, getState)
      return
    }
  }
  // ファイル本体受信
  const receiveData = new Uint8Array(event.data)
  const id = bufferToString(receiveData.slice(flagLength, flagLength + idLength))
  const receiveFileInfo = getState().receiver.receiveFileList[id]
  updateReceiveFileStorage(id, receiveData, dispatch, getState)
  updateReceiveFileList(id, 'receivePacketCount', receiveFileInfo.receivePacketCount + 1, dispatch, getState)
  updateReceiveFileList(id, 'receive', Math.ceil(receiveFileInfo.receivePacketCount / receiveFileInfo.sendTime * 1000.0) / 10.0, dispatch, getState)

  return console.log('データ受信中')
}

const setSocket = (socket) => ({
  type: prefix + 'SET_SOCKET',
  payload: { socket }
})

const setSelfID = (selfID) => ({
  type: prefix + 'SET_SELF_ID',
  payload: { selfID }
})

const setSenderID = (senderID) => ({
  type: prefix + 'SET_SENDER_ID',
  payload: { senderID }
})

const dataChannelOpenStatus = (dataChannelOpenStatus) => ({
  type: prefix + 'DATACHANNEL_OPEN_STATUS',
  payload: { dataChannelOpenStatus }
})

const setReceiveFileUrlList = (receiveFileUrlList) => ({
  type: prefix + 'SET_RECEIVE_FILE_URL_LIST',
  payload: { receiveFileUrlList }
})

const setReceivedFileUrl = (receivedFileUrl) => ({
  type: prefix + 'SET_RECEIVED_FILE_URL',
  payload: { receivedFileUrl }
})

const setReceiveFileStorage = (receiveFileStorage) => ({
  type: prefix + 'SET_RECEIVE_FILE_STORAGE',
  payload: { receiveFileStorage }
})
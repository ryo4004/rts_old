const express = require('express')
const app = express()

const fs = require('fs')
const path = require('path')

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))

// ライブラリの読み込み
const lib = require('./server/lib')

// HTTPSを使用する(local用)
const https = require('https')
const privateKey = fs.readFileSync( '/root/localhost.key' )
const certificate = fs.readFileSync( '/root/localhost.crt' )
const server = https.createServer({
  key: privateKey,
  cert: certificate
}, app)

// HTTPを使用する(公開用)
// const http = require('http')
// const server = http.createServer(app)

const compression = require('compression')
app.use(compression({
  threshold: 0,
  level: 9,
  memLevel: 9
}))

// CORSを許可する
// app.use((req, res, next) => {
//   // res.header('Access-Control-Allow-Origin', 'http://192.168.1.22:3001')
//   // res.header('Access-Control-Allow-Origin', 'https://member.winds-n.com')
//   // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
//   next()
// })

// クライアントアプリを返す
const client = './client/build'
app.use('/', express.static(client))
app.use('/:id', express.static(client))

// データベース準備
const NeDB = require('nedb')
const statusDB = new NeDB({
  filename: path.join(__dirname, 'server/database/status.db'),
  autoload: true,
  timestampData: true
})

statusDB.remove({}, {multi: true}, (err, numRemoved) => {
  console.log('[' + lib.showTime() + '] statusDB refresh: ' + numRemoved)
})

// api設定
app.post('/api/presenter', (req, res) => {
  const id = req.body.id
  console.log('[' + lib.showTime() + '] api/presenter: ' + id)
  statusDB.find({type: 'presenter'}, (err, doc) => {
    res.json({status: true, doc})
  })
})

app.post('/api/recorder', (req, res) => {
  // console.log(req.body)
  const id = req.body.id
  console.log('[' + lib.showTime() + '] api/recorder: ' + id)
  statusDB.find({type: 'recorder'}, (err, doc) => {
    if (err || !doc || doc.length === 0) return res.json({status: true, recorder: false})
    res.json({status: true, recorder: true})
  })
})

// WebSocketサーバを使用
const io = require('socket.io')(server)

// function getSocketID (id, callback) {
//   statusDB.findOne({ id }, (err, status) => {
//     if (err) return callback('[getSocketID] database error: findOneエラー', null)
//     if (!status) return callback('[getSocketID] ' + id + ' not found', null)
//     return callback(null, status.socketid)
//   })
// }

const getSocketID = (id) => {
  return new Promise((resolve, reject) => {
    statusDB.findOne({ id }, (err, status) => {
      if (err) return resolve(null, 'id error')
      if (!status) return resolve(null, 'id error')
      return resolve(status.socketid, null)
    })
  })
}

// 接続処理
io.on('connection', (socket) => {
  // URL用ID作成
  const id = lib.randomString()  
  // console.log('(socket)[' + lib.showTime() + '] connection: ', socket.client.id, 'id: ', id)
  const reg = { status: 'connection', socketid: socket.client.id, id }
  statusDB.insert(reg, (err, newdoc) => {
    if (err) return console.log('database error')
    // id を通知
    io.to(socket.client.id).emit('connection_complete', { id })
    console.log('(socket)[' + lib.showTime() + '] connect complete: ' + socket.client.id, id)
  })

  // First request from Receiver to Sender
  // socket.on('request_to_sender', (obj) => {
  //   console.log('(socket)[' + lib.showTime() + '] request_to_sender: ', obj)
  //   getSocketID(obj.from, (err, fromSocket) => {
  //     console.log('from: ', fromSocket)
  //     getSocketID(obj.to, (err, toSocket) => {
  //       console.log('to: ', toSocket)
  //       io.to(toSocket).emit('request_to_sender', obj)
  //     })
  //   })
  // })

  // First request from Receiver to Sender
  socket.on('request_to_sender', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] request_to_sender',)
    // const fromSocket = await getSocketID(obj.from)
    const toSocket = await getSocketID(obj.to)
    // console.log('from: ', fromSocket)
    console.log('to: ', toSocket)
    io.to(toSocket).emit('request_to_sender', obj)
  })

  // Reciever send offer SDP
  socket.on('send_offer_sdp', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] send_offer_sdp')
    const toSocket = await getSocketID(obj.to)
    io.to(toSocket).emit('send_offer_sdp', obj)
  })
  
  // Sender send answer SDP
  socket.on('send_answer_sdp', async (obj) => {
    console.log('(socket)[' + lib.showTime() + '] send_answer_sdp')
    const toSocket = await getSocketID(obj.to)
    io.to(toSocket).emit('send_answer_sdp', obj)
  })

  // お互いに交換
  socket.on('send_found_candidate', async (obj) => {
    const toSocket = await getSocketID(obj.to)
    console.log('(socket)[' + lib.showTime() + '] find: from ' + obj.selfType + ' to ' +  obj.to)
    // console.log(JSON.stringify(obj.candidate, null, 2))
    io.to(toSocket).emit('send_found_candidate', obj)
  })

  // 接続解除
  socket.on('disconnecting', (reason) => {
    statusDB.findOne({socketid: socket.client.id}, (err, status) => {
      if (err) return console.log('database error: findOneエラー')
      if (!status) return console.log(socket.client.id + ' not found')
      statusDB.remove({socketid: socket.client.id}, {multi: false}, (err,numRemoved) => {
        if (err || !numRemoved) return console.log('database error: removeエラー')
        console.log('(socket)[' + lib.showTime() + '] disconnect complete: ' + socket.client.id, reason)
      })
    })
  })

  // socket.on('recorder_standby', (data) => {
  //   console.log('(socket)[' + lib.showTime() + '] recorder_standby: ', data)
  //   const reg = {type: 'recorder', status: data.status, id: data.recorderid}
  //   statusDB.insert(reg, (err, newdoc) => {
  //     if (err) return console.log('recorder standbyエラー')
  //     console.log('recorder standby...')
  //     // console.log(newdoc)
  //     io.emit('recorder_standby', data)
  //   })
  // })

  // socket.on('cast_start', (data) => {
  //   console.log('(socket)[' + lib.showTime() + '] cast_start: ', data)
  //   const reg = {type: 'presenter', status: data.status, id: data.presenterid}
  //   statusDB.insert(reg, (err, newdoc) => {
  //     if (err) return console.log('cast startエラー')
  //     console.log('cast start...')
  //     io.emit('cast_start', data)
  //   })
  // })

  // socket.on('cast_end', (data) => {
  //   console.log('(socket)[' + lib.showTime() + '] cast_end: ', data)
  //   const reg = {type: 'presenter', status: data.status, id: data.presenterid}
  //   statusDB.update({id: data.presenterid}, reg, {}, (err, newdoc) => {
  //     if (err) return console.log('cast endエラー')
  //     console.log('cast end')
  //     io.emit('cast_end', data)
  //   })
  // })

  // SDP交換
  // Receiver から Presenter へ
  // socket.on('offer', (data) => {
  //   const to = data.to
  //   console.log('(socket)[' + lib.showTime() + '] send offer to: ', to)
  //   io.to(to).emit('offer', data)
  // })
  // // Presenter から Receiver へ
  // socket.on('answer', (data) => {
  //   const to = data.to
  //   console.log('(socket)[' + lib.showTime() + '] send answer to: ', to)
  //   io.to(to).emit('answer', data)
  // })


})

// app.use('/reg', express.static(client))
// app.use('/score', express.static(client))
// app.use('/score/add', express.static(client))
// app.use('/score/edit', express.static(client))
// app.use('/score/edit/:id', express.static(client))
// app.use('/score/detail/:id', express.static(client))
// app.use('/score/box', express.static(client))
// app.use('/score/csv', express.static(client))
// app.use('/score/setting', express.static(client))
// app.use('/score/setting/:path', express.static(client))

server.listen(3000)
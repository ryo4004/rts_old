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
app.use('/presenter', express.static(client))

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

io.on('connection', (socket) => {
  console.log('(socket)[' + lib.showTime() + '] connection: ', socket.client.id)

  socket.on('recorder_standby', (data) => {
    console.log('(socket)[' + lib.showTime() + '] recorder_standby: ', data)
    const reg = {type: 'recorder', status: data.status, id: data.recorderid}
    statusDB.insert(reg, (err, newdoc) => {
      if (err) return console.log('recorder standbyエラー')
      console.log('recorder standby...')
      // console.log(newdoc)
      io.emit('recorder_standby', data)
    })
  })

  socket.on('cast_start', (data) => {
    console.log('(socket)[' + lib.showTime() + '] cast_start: ', data)
    const reg = {type: 'presenter', status: data.status, id: data.presenterid}
    statusDB.insert(reg, (err, newdoc) => {
      if (err) return console.log('cast startエラー')
      console.log('cast start...')
      io.emit('cast_start', data)
    })
  })

  socket.on('cast_end', (data) => {
    console.log('(socket)[' + lib.showTime() + '] cast_end: ', data)
    const reg = {type: 'presenter', status: data.status, id: data.presenterid}
    statusDB.update({id: data.presenterid}, reg, {}, (err, newdoc) => {
      if (err) return console.log('cast endエラー')
      console.log('cast end')
      io.emit('cast_end', data)
    })
  })

  // SDP交換
  // Receiver から Presenter へ
  socket.on('offer', (data) => {
    const to = data.to
    console.log('(socket)[' + lib.showTime() + '] send offer to: ', to)
    io.to(to).emit('offer', data)
  })
  // Presenter から Receiver へ
  socket.on('answer', (data) => {
    const to = data.to
    console.log('(socket)[' + lib.showTime() + '] send answer to: ', to)
    io.to(to).emit('answer', data)
  })
  // お互いに交換
  socket.on('find', (data) => {
    const to = data.to
    console.log('(socket)[' + lib.showTime() + '] find: from ' + data.from + ' to ' +  data.to)
    io.to(to).emit('find', data)
  })

  // 切断時処理
  socket.on('disconnecting', (reason) => {
    console.log('(socket)[' + lib.showTime() + '] disconnecting: ', socket.client.id, reason)
    statusDB.findOne({id: socket.client.id}, (err, status) => {
      if (err) return console.log('findOneエラー')
      if (!status) return console.log(socket.client.id + ' is Receiver')
      console.log(status.type)
      statusDB.remove({id: socket.client.id}, {multi: false}, (err,numRemoved) => {
        if (err || !numRemoved) return console.log('removeエラー')
        console.log(socket.client.id + ' stanby終了')
      })
    })
  })
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
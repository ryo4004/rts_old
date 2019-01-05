import request from 'superagent'

export function post (url, send, callback) {
  request.post(url)
    .type('form')
    .send(send)
    .end((error, response) => {
      return callback(error, response)
    })
}
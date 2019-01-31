import uniqid from 'uniqid'

export const appName = 'blog'
export const version = '0.0.1'

export const divisionWidth = 960

// // yyyy-mm-ddThh:mm:ss.sssZ
// export function getDate (str) {
//   return str.split('T')[0].replace(/-/g, '/')
// }

// // yyyy-mm-ddThh:mm:ss.sssZ
// export function getTime (str) {
//   return str.split('T')[1].split(':')[0] + ':' + str.split('T')[1].split(':')[1]
// }

export function fileIcon (name, type) {
  const extension = name.indexOf('.') !== -1 ? name.split('.')[name.split('.').length - 1] : false
  // console.log(extension, name, type)
  if (type === 'text/html') {
    return 'fas fa-file-code'
  } else if (type.indexOf('text/css') === 0) {
    return 'fas fa-file-code'
  } else if (type.indexOf('text/javascript') === 0) {
    return 'fas fa-file-code'
  } else if (type.indexOf('application/json') === 0) {
    return 'fas fa-file-code'
  } else if (type.indexOf('application/x-zip-compressed') === 0) {
    return 'fas fa-file-archive'
  } else if (type.indexOf('application/pdf') === 0) {
    return 'fas fa-file-pdf'
  } else if (type.indexOf('application/vnd.openxmlformats-officedocument.wordprocessingml.document') === 0) {
    // 最新のWord
    return 'fas fa-file-word'
  } else if (type.indexOf('application/msword') === 0) {
    // 97-2003
    return 'fas fa-file-word'
  } else if (type.indexOf('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') === 0) {
    // 最新のExcel
    return 'fas fa-file-excel'
  } else if (type.indexOf('application/vnd.ms-excel') === 0) {
    // 97-2003
    if (extension === 'csv') {
      return 'fas fa-file-csv'
    }
    return 'fas fa-file-excel'
  } else if (type.indexOf('application/ms-excel') === 0) {
    // 不明
    return 'fas fa-file-excel'
  } else if (type.indexOf('application/vnd.openxmlformats-officedocument.presentationml.presentation') === 0) {
    // 最新のPowerPoint
    return 'fas fa-file-powerpoint'
  } else if (type.indexOf('application/vnd.ms-powerpoint') === 0) {
    // 97-2003
    return 'fas fa-file-powerpoint'
  } else if (type.indexOf('image') === 0) {
    return 'fas fa-file-image'
  } else if (type.indexOf('audio') === 0) {
    return 'fas fa-file-audio'
  } else if (type.indexOf('video') === 0) {
    return 'fas fa-file-video'
  } else if (type.indexOf('text') === 0) {
    return 'fas fa-file-alt'
  }
  if (extension === 'md') {
    return 'fas fa-file-code'
  } else if (extension === 'scss') {
    return 'fas fa-file-code'
  } else if (extension === 'gitignore') {
    return 'fas fa-file-code'
  } else if (extension === 'py') {
    return 'fas fa-file-code'
  }
  return 'fas fa-file'
}

export function fileSizeUnit (size) {
  // 1 KB = 1024 Byte
  const kb = 1024
  const mb = Math.pow(kb, 2)
  const gb = Math.pow(kb, 3)
  const tb = Math.pow(kb, 4)
  const pb = Math.pow(kb, 5)

  const round = (size, unit) => {
    return Math.round(size / unit * 100.0) / 100.0
  }

  if (size >= pb) {
    return round(size, pb).toFixed(2) + 'PB'
  } else if (size >= tb) {
    return round(size, tb).toFixed(2) + 'TB'
  } else if (size >= gb) {
    return round(size, gb).toFixed(2) + 'GB'
  } else if (size >= mb) {
    return round(size, mb).toFixed(2) + 'MB'
  } else if (size >= kb) {
    return round(size, kb).toFixed(2) + 'KB'
  }
  return size + 'バイト'
}

export function randomString () {
  const character = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (var i=0; i<8; i++) { id += character[Math.floor(Math.random()*character.length)] }
  return uniqid.time() + id
}

// charCodeAtは65535までの値を返すが、idは英数字のみなので255以内に収まるはず
export function stringToBuffer (str) {
  return new Uint8Array([].map.call(str, (c) => c.charCodeAt(0)))
}

export function bufferToString (buffer) {
  return String.fromCharCode.apply('', new Uint8Array(buffer))
}
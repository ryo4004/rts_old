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

export function fileSizeUnit (size) {
  let result
  let unit
  if (size > 999999) {
    result = Math.ceil(size / 100000) / 10
    // result = Math.ceil(size / 1000000)
    unit = 'MB'
  } else if(size > 999 && size <= 999999) {
    result = Math.ceil(size / 100) / 10
    // result = Math.ceil(size / 1000)
    unit = 'KB'
  } else {
    result = size
    unit = 'Byte'
  }
  return result + unit
}
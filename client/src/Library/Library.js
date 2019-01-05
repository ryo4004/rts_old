export const appName = 'blog'
export const version = '0.0.1'

export const divisionWidth = 960

// yyyy-mm-ddThh:mm:ss.sssZ
export function getDate (str) {
  return str.split('T')[0].replace(/-/g, '/')
}

// yyyy-mm-ddThh:mm:ss.sssZ
export function getTime (str) {
  return str.split('T')[1].split(':')[0] + ':' + str.split('T')[1].split(':')[1]
}

export function renderMarkdown (contents) {

}

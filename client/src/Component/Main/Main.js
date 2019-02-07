import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'

import { connect } from 'react-redux'
import { windowWidthChange } from '../../Actions/Status'

import { addFile } from '../../Actions/Sender'

import Home from './Home/Home'
import Host from './Host/Host'
import Guest from './Guest/Guest'

import './Main.css'

function mapStateToProps(state) {
  return {
    mobile: state.status.mobile,
    location: state.router.location
  }
}

function mapDispatchToProps(dispatch) {
  return {
    windowWidthChange () {
      dispatch(windowWidthChange())
    },
    addFile (fileList) {
      dispatch(addFile(fileList))
    }
  }
}

class Main extends Component {
  constructor (props) {
    super(props)
    this.contents = React.createRef()
  }

  componentWillMount () {
  }

  // Windowサイズの検出と記録
  componentDidMount () {
    this.props.windowWidthChange()
    window.addEventListener('resize', () => {
      this.props.windowWidthChange()
    })
  }

  componentWillUnmount () {
    window.removeEventListener('resize', () => {})
  }

  onDragOver (e) {
    e.preventDefault()
  }

  onDrop (e) {
    e.preventDefault()
    if (e.dataTransfer.files.length === 0) return false
    this.props.addFile(e.dataTransfer.files)
  }

  render () {
    const { mobile, location } = this.props
    const mobileMode = mobile ? ' mobile' : ' pc'
    // console.log('location',location)
    // if (loading) return <div className='full-loading'><div className="loading"><div className="loading1"></div><div className="loading2"></div><div className="loading3"></div></div></div>
    return (
      <div className={'contents' + mobileMode} ref={this.contents} onDragOver={(e) => this.onDragOver(e)} onDrop={(e) => this.onDrop(e)}>
        <div className='drop-frame'>
        </div>
        <Switch>
          <Route path='/host' component={Host} />
          <Route path='/:senderSocketID' component={Guest} />
          <Route path='/' component={Home} />
        </Switch>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Main)

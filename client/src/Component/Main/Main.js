import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'

import { connect } from 'react-redux'
import { windowWidthChange } from '../../Actions/Status'

import Sender from './Sender/Sender'
import Receiver from './Receiver/Receiver'

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

  render () {
    const { mobile, location } = this.props
    const mobileMode = mobile ? ' mobile' : ' pc'
    // console.log('location',location)
    // if (loading) return <div className='full-loading'><div className="loading"><div className="loading1"></div><div className="loading2"></div><div className="loading3"></div></div></div>
    return (
      <div className={'contents' + mobileMode} ref={this.contents}>
        <Switch>
          <Route path='/:senderID' component={Receiver} />
          <Route path='/' component={Sender} />
        </Switch>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Main)

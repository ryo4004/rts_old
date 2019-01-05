import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'

import { connect } from 'react-redux'
import { setLocation, windowWidthChange } from '../../Actions/Status'

import Home from './Home/Home'

function mapStateToProps(state) {
  return {
    mobile: state.status.mobile,
    location: state.router.location
  }
}

function mapDispatchToProps(dispatch) {
  return {
    setLocation (location) {
      dispatch(setLocation(location))
    },
    windowWidthChange () {
      dispatch(windowWidthChange())
    },
  }
}

class Main extends Component {
  constructor (props) {
    super(props)
    this.contetns = React.createRef()
  }
  
  componentWillMount () {
    // 過去のlocation情報が存在する場合はそのページへRedirect
    // this.props.setLocation(window.localStorage.location ? window.localStorage.location : false)
  }

  componentWillReceiveProps (nextProps, nextContext) {
    if(this.contents) {
      this.contents.scrollTop = 0
    }
  }

  componentDidUpdate () {
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
          <Route path='/' component={Home} />
        </Switch>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Main)

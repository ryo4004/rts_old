import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

// import { loadList } from '../../../Actions/Reader'

import { getDate } from '../../../Library/Library'

import './Home.css'

function mapStateToProps(state) {
  return {
    mobile: state.status.mobile,

    loading: state.reader.loading,
    list: state.reader.list
  }
}

function mapDispatchToProps(dispatch) {
  return {
    // loadList () {
    //   dispatch(loadList())
    // }
  }
}

class Home extends Component {
  constructor (props) {
    super(props)
    // this.props.loadList()
  }

  renderList () {
    if (this.props.loading) return <div>読み込み中</div>
    if (this.props.list.length === 0) return <div>データがありません</div>
    const list = this.props.list.map((each, i) => {
      const updateIcon = getDate(each.createdAt) === getDate(each.updatedAt) ? <i className="far fa-clock"></i> : <i className="fas fa-sync-alt"></i>
      return (
        <li key={'article' + i}>
          <Link to={'/' + each.category + '/' + each.postname}>
            <div className='date'>
              <span>{updateIcon}{getDate(each.updatedAt)}</span>
            </div>
            <div className='title'>
              <span>{each.title}</span>
            </div>
          </Link>
        </li>
      )
    })
    return <ul>{list}</ul>
  }

  render () {
    // State List
    const { mobile, loading } = this.props
    // Dispatch List
    // const { logout } = this.props
    const mobileMode = mobile ? ' mobile' : ' pc'

    const showList = this.renderList()

    // console.warn('match',this.props.match)
    return (
      <div className={'home' + mobileMode}>
        <header>
          <div>
            <h2><Link to='/'>RTS</Link></h2>
          </div>
        </header>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home)

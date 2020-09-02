import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'

import { prepare } from '../../../Actions/Status'

import Profile from '../../../Assets/profile-pic.jpg'

import './Home.css'

function mapStateToProps(state) {
  return {
    loading: state.status.loading,
    mobile: state.status.mobile,
    fileAPI: state.status.fileAPI,
    available: state.status.available,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    prepare () {
      dispatch(prepare())
    }
  }
}

class Home extends Component {
  render () {
    const mobileMode = this.props.mobile ? ' mobile' : ' pc'
    return (
      <div className={'home' + mobileMode}>
        <header>
          <div>
            <h2><Link to='/'>Real-Time File Transfer</Link></h2>
            <span><Link to='/host'>はじめる</Link></span>
          </div>
        </header>
        <div className='main'>
          <div className='title'>
            <div>
              <h1>リアルタイムファイル転送サービス</h1>
              <p>WebRTCを利用したファイル転送サービスです</p>
              <div>
                <Link to='/host'>はじめる</Link>
              </div>
            </div>
          </div>
          <div className='tutorial'>
            <div className={'feature' + mobileMode}>
              <div>
                <div className='icon'><i className='far fa-paper-plane'></i></div>
                <h3>Real-Time Transfer</h3>
                <p>
                  このサービスは WebRTC DataChannel を利用したファイル転送サービスです。<br />
                  WebRTC はユーザー(ブラウザ)の間にP2P接続を確立し直接データのやりとりを行う技術です。
                </p>
                <p className='webrtc'>
                  <a href='https://webrtc.org/' target='_blank' className='webrtc'>WebRTCについて</a>
                </p>
              </div>
              <div>
                <div className='icon'><i className='fas fa-briefcase'></i></div>
                <h3>Size Limit</h3>
                <p>
                  送信するファイルのサイズ制限はありません。<br />
                  ブラウザですべての処理を行うためRAMメモリによって受信できるサイズは変わるようです。
                  Chrome 64bit で 1GB を超えるとブラウザがクラッシュしやすくなるみたいです。(調査中)
                </p>
              </div>
            </div>
            <div className={'feature' + mobileMode}>
              <div>
                <div className='icon'><i className='fas fa-user-secret'></i></div>
                <h3>Privacy</h3>
                <p>
                  P2P接続のためにサーバを利用しますが、ファイル転送にサーバを介さず、送信したデータがWeb上に残ることはありません。
                  サーバへの一時アップロードを行わないため、送信完了まで双方がページを開いている必要があります。
                </p>
              </div>
              <div>
                <div className='icon'><i className='fas fa-lock'></i></div>
                <h3>Security</h3>
                <p>
                  WebRTC DataChannel の通信はSSLを使用したDTLSにより暗号化されます。<br />
                  これによりデータの改竄や盗聴などの中間者攻撃を防止します。
                </p>
              </div>
            </div>
            <h3>対応ブラウザ</h3>
            <p>
              WebRTCに対応している以下のブラウザおよびプラットフォームでご利用いただけます。
            </p>
            <div className='browsers'>
              <div className='browser'>
                <i className='fab fa-chrome'></i><span>Chrome</span>
              </div>
              <div className='browser'>
                <i className='fab fa-firefox'></i><span>Firefox</span>
              </div>
              <div className='browser'>
                <i className='fab fa-opera'></i><span>Opera</span>
              </div>
              <div className='browser'>
                <i className='fab fa-safari'></i><span>Safari</span>
              </div>
              <div className='browser'>
                <i className='fab fa-android'></i><span>Android</span>
              </div>
              <div className='browser'>
                <i className='fab fa-apple'></i><span>iOS</span>
              </div>
            </div>
            <h3>その他</h3>
            <p>
              詳しくは<a href='https://blog.zatsuzen.com/blog/rts/' target='_blank'>こちら</a>(まだ書いてない笑)
            </p>
            <h3>免責事項</h3>
            <p>
              このサービスを利用して発生したいかなる損害にも責任を負いません。
            </p>
            <h3>使い方</h3>
            <ol>
              <li>共有URLをファイルを共有する相手に通知します</li>
              <li>自動的に相手との間にP2P接続を試みます</li>
              <li>相手との間に接続が確立するとdataChannelマークが<i className='fas fa-check-circle'></i>になります</li>
              <li>ファイルを追加して送信ボタンを押すとファイルを送信できます</li>
            </ol>
          </div>
        </div>
        <footer>
          <div className='title'>
            <h2><Link to='/'>Real-Time File Transfer</Link></h2>
          </div>
          <div className='author'>
            <img src={Profile} />          
            <p>akanewz<a href='https://twitter.com/akanewz' target='_blank'><i className="fab fa-twitter"></i></a></p>
          </div>
        </footer>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home)

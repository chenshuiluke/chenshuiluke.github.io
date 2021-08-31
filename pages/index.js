import Head from 'next/head'
import gridStyles from '../styles/flexboxgrid.module.css';
import styles from '../styles/Home.module.css';
import Img from 'react-optimized-image';

import Hls from 'hls.js';
import { Component } from 'react';
import cx from 'classNames';

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {muted: true};
  }
  render() {
    return (
      <>
        <div className={gridStyles.row}>
          <div className={cx(styles['col-md-6'], gridStyles['col-xs-6'], gridStyles['col-md-6'])}>
            <video className={styles.coverVideo} id="bg-video-1" muted={this.state.muted} autoPlay loop>
            </video>
          </div>
          <div className={cx(styles['col-md-6'], gridStyles['col-xs-6'], gridStyles['col-md-6'])}>
            <Img className={styles.coverImage} src={require('../assets/img/2019-10-26-cupcake.jpg')} />
          </div>
        </div>
        <div className={gridStyles.row}>
          <div className={cx(styles['col-md-6'], gridStyles['col-xs-6'], gridStyles['col-md-6'])}>
            <Img className={styles.coverImage} src={require('../assets/img/2019-10-26-flowers.jpg')} />
          </div>
          <div className={cx(styles['col-md-6'], gridStyles['col-xs-6'], gridStyles['col-md-6'])}>
            <video className={styles.coverVideo} id="bg-video-2" muted={this.state.muted} autoPlay loop>

            </video>

          </div>
        </div>
        <Img className={styles['profile-picture']} src={require('../assets/img/me.jpeg')} />
        <div className={styles['heading-box']}>
          <h1>Hi!</h1>
          <h2>I&apos;m Luke Chen Shui</h2>
          <p onClick={this.toggleAudio}>Toggle Background Audio</p>
        </div>
      </>
    )
  }

  componentDidMount() {
    const backgroundVideos = [
      {
        muxUrl: "https://stream.mux.com/y1iQ8sgKnP7E46I1jlhg01SWvWQOarF4P.m3u8",
        elementId: "bg-video-1"
      },
      {
        muxUrl: "https://stream.mux.com/IvspGT000267qXPow500zG502OUPxi2KuRSG.m3u8",
        elementId: "bg-video-2"
      }
    ];

    // HLS.js-specific setup code
    if (Hls.isSupported()) {
      for (var counter = 0; counter < backgroundVideos.length; counter++) {
        var bgVideo = backgroundVideos[counter];
        var url = bgVideo.muxUrl;
        var video = document.getElementById(bgVideo.elementId);
        var hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
      }

    }
  }

  toggleAudio = () => {
    this.setState({
      muted: !this.state.muted
    })
  }

}

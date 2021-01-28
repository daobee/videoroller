import React from 'react'
import FlvJs from 'flv.js'

import './reflv.less'

interface Props extends FlvJs.MediaDataSource {
  className?: string
  style?: unknown
  config?: FlvJs.Config
}

interface State {
  path: string
}

export class Reflv extends React.Component<Props, State> {
  flvPlayer?: FlvJs.Player

  componentWillUnmount(): void {
    if (this.flvPlayer) {
      this.flvPlayer.unload()
      this.flvPlayer.detachMediaElement()
    }
  }

  render(): JSX.Element {
    const { className, style } = this.props
    return (
      <video
        className={className}
        controls={true}
        style={Object.assign(
          {
            width: '100%',
          },
          style
        )}
        ref={this.initFlv}
      />
    )
  }

  initFlv = ($video: HTMLVideoElement): void => {
    if ($video) {
      if (FlvJs.isSupported()) {
        const flvPlayer = FlvJs.createPlayer({ ...this.props }, this.props.config)
        flvPlayer.attachMediaElement($video)
        flvPlayer.load()
        flvPlayer.play()
        flvPlayer.on('ERROR', () => {
          flvPlayer.pause()
          flvPlayer.unload()
        })
        this.flvPlayer = flvPlayer
      }
    }
  }
} // class Reflv end

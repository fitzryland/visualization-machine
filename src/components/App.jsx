import React from 'react'
import '../style.css'
let video = false
let canvas = false
let displayCanvas = false
let displayCtx = false
let width = 60
let height = 45
let prevImg = false
let pixels = []
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.stateHandler = this.stateHandler.bind(this)
    this.processImgData = this.processImgData.bind(this)
    this.isDifferent = this.isDifferent.bind(this)
    this.plotChange = this.plotChange.bind(this)
  }
  stateHandler(stateUpdates, callback = () => {}) {
    if ( typeof stateUpdates === 'object' ) {
      this.setState(stateUpdates, callback)
    }
  }
  componentDidMount() {
    video = document.getElementById('camera')
    canvas = document.getElementById('canvas')
    var ctx = canvas.getContext('2d')
    displayCanvas = document.getElementById('js-display_canvas')
    displayCtx = displayCanvas.getContext('2d')
    navigator.mediaDevices.getUserMedia({video: true})
      .then(function(stream) {
        video.srcObject = stream
        video.onloadedmetadata = function(e) {
          video.play()
        }
      }).catch(function() {
        alert('could not connect stream')
      })
    let localThis = this
    video.addEventListener('play', function () {
      (function loop() {
        // 640 / 480
        ctx.drawImage(video, 0, 0, width, height)
        let imgData = ctx.getImageData(0, 0, width, height).data
        localThis.processImgData(imgData)
        setTimeout(loop, 1000 / 15) // drawing at 15fps
      })();
    }, 0);
  }
  isDifferent(a, b) {
    if ( Math.abs(a - b) > 50 ) {
      return true;
    } else {
      return false;
    }
  }
  processImgData(imgData) {
    // console.log('imgData from processImgData', imgData)
    // loop through rows
    if ( prevImg ) {
      for ( var row = 0; row < height; row++ ) {
        // loop through columns
        for ( var col = 0; col < width; col++ ) {
          let position = (row + col * width) * 4
          let r = imgData[position]
          let g = imgData[position + 1]
          let b = imgData[position + 2]
          let prevR = prevImg[position]
          let prevG = prevImg[position + 1]
          let prevB = prevImg[position + 2]
          if (
            this.isDifferent(r, prevR)
            ||
            this.isDifferent(g, prevG)
            ||
            this.isDifferent(b, prevB)
          ) {
            // this one changed!!
            this.plotChange(row, col)
          }
        }
      }
    }
    prevImg = imgData
  }
  plotChange(row, col) {
    // displayCtx.fillStyle = 'hotpink'
    // displayCtx.rect((row * 10), (col * 10), 10, 10)
    // displayCtx.fill()
    // let x = (row * 10)
    // let y = (col * 10)
    // let pixel = new Path2D()
    // pixel.moveTo(x, y)
    // pixel.lineTo(x + 10, y)
    // pixel.lineTo(x + 10, y + 10)
    // pixel.lineTo(x, y + 10)
    // pixel.lineTo(x, y)
    // pixel.closePath()
    // displayCtx.fillStyle = 'hotpink'
    // displayCtx.fill(pixel)
    // setTimeout(() => {
    //   displayCtx.fillStyle = 'black'
    //   displayCtx.fill(pixel)
    // }, 1000)


    // let pixel = document.createElement('div')
    // pixel.className = 'pixel'
    // pixel.style.top = (col * 10) + 'px'
    // pixel.style.left = (row * 10) + 'px'
    // document.getElementById('display').appendChild(pixel)
    // setTimeout(() => {
    //   pixel.remove()
    // }, 1000)
  }
  render() {
    return (
      <div className="app_wrap">
        <video
          className="capture_video"
          id="camera"
          autoplay
        ></video>
        <canvas
          className="capture_canvas"
          id="canvas"
        ></canvas>
        <canvas
          className="display_canvas"
          id="js-display_canvas"
        ></canvas>
        <div
          id="display"
          className="visual_display"
        ></div>
      </div>
    )
  }
}
export default App
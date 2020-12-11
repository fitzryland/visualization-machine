import React from 'react'

let video = false
let canvas = false
// @TODO will need to be adjusted for whatever screen I end up using
let width = 0
// let height = window.innerHeight
let height = 0
let intervalId

class Capture extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.takePhoto = this.takePhoto.bind(this)
    this.startCountdown = this.startCountdown.bind(this)
  }
  takePhoto() {
    console.log('takePhoto')
    clearInterval(intervalId)
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      var data = canvas.toDataURL('image/jpg');
      this.props.stateHandler({
        mode: 'confirm',
        capturedImage: data
      })
    } else {
      // clearphoto();
    }
  }
  startCountdown() {
    let countdownI = 5;
    intervalId = setInterval(() => {
      console.log(countdownI)
      let newMessage = ( countdownI === 0 ? 'KABLAMO!!' : countdownI )
      newMessage = <p>{newMessage}</p>
      this.props.stateHandler({
        message: newMessage
      })
      if ( countdownI <= 0 ) {
        console.log('KABLAMO!!')
        this.takePhoto()
      }
      --countdownI
    }, 1000)
  }
  componentDidMount() {
    let startCountdown = this.startCountdown
    // document.addEventListener("keydown", this.keydownHandler.bind(this))
    this.props.stateHandler({
      message: ''
    })
    width = window.innerWidth
    video = document.getElementById('camera')
    canvas = document.getElementById('canvas')
    navigator.mediaDevices.getUserMedia({video: true})
      .then(function(stream) {
        video.srcObject = stream
        video.onloadedmetadata = function(e) {
          video.play()
        }
      }).catch(function() {
        alert('could not connect stream')
      })
      video.addEventListener('canplay', function(ev){
        height = video.videoHeight / (video.videoWidth/width)
        video.setAttribute('width', width)
        video.setAttribute('height', height)
        canvas.setAttribute('width', width)
        canvas.setAttribute('height', height)
        startCountdown()
      })
  }
  componentWillUnmount() {
    // document.removeEventListener("keydown", this.keydownHandler)
  }
  render() {
    return (
      <div className="capture_wrap">
        <video
          className="capture_video"
          id="camera"
          autoplay
        ></video>
        <canvas
          className="capture_canvas"
          id="canvas"
        ></canvas>
      </div>
    )
  }
}
export default Capture
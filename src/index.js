import easing from './easing'

var fVisualizer = {
  camera: document.getElementById('js-camera'),
  captureCanvas: document.getElementById('js-capture_canvas'),
  displayCanvas: document.getElementById('js-display_canvas'),
  displayCtx: false,
  captureCtx: false,
  audioAnalyser: false,
  audioFrequencyArray: false,
  inits: {
    audio: false,
    video: false
  },
  captureWidth: 40,
  captureHeight: 30,
  displayWidth: false,
  displayHeight: false,
  scale: 20,
  prevImg: false,
  pixels: [],
  fadeDuration: 1000,
  curColorI: 0,
  isDifferent(a, b) {
    if ( Math.abs(a - b) > 50 ) {
      return true;
    } else {
      return false;
    }
  },
  mapRange( val, inMin, inMax, outMin, outMax ) {
    return ( val - inMin ) * ( outMax - outMin ) / ( inMax - inMin ) + outMin
  },
  plotPixel(row, col, time) {
    var that = this
    let key = row + '_' + col
    that.pixels[key] = {
      row: row,
      col: that.captureWidth - 1 - col,
      birth: time
    }
  },
  processImgData(imgData) {
    let that = this;
    if ( that.prevImg ) {
      // loop through rows
      let time = Date.now()
      for ( var row = 0; row < that.captureHeight; row++ ) {
        // loop through columns
        for ( var col = 0; col < that.captureWidth; col++ ) {
          let position = (col + row * that.captureWidth) * 4
          let r = imgData[position]
          let g = imgData[position + 1]
          let b = imgData[position + 2]
          let prevR = that.prevImg[position]
          let prevG = that.prevImg[position + 1]
          let prevB = that.prevImg[position + 2]
          if (
            that.isDifferent(r, prevR)
            ||
            that.isDifferent(g, prevG)
            ||
            that.isDifferent(b, prevB)
          ) {
            // that one changed!!
            that.plotPixel(row, col, time)
          }
        }
      }
    }
    that.prevImg = imgData
  },
  processAudioData() {
    var that = this
    let time = Date.now()
    for (var i = 0 ; i < 32; i++) {
      var barHeight = that.mapRange( that.audioFrequencyArray[i], 0, 255, 0, that.captureHeight )
      for ( var ii = 0; ii < barHeight; ii++ ) {
        that.plotPixel(ii, i, time)
      }
    }
  },
  render() {
    let that = this
    let now = Date.now()
    that.displayCtx.clearRect(0, 0, that.displayWidth, that.displayHeight)
    for (const [key, value] of Object.entries(that.pixels)) {
      if ( now - value.birth >= that.fadeDuration ) {
        that.pixels[key] = []
      } else if ( 'birth' in value ) {
        if ( !('color' in value) ) {
          that.pixels[key].color = that.curColorI
        }
        let alpha = easing.easeOutQuad(now - value.birth, 1, -1, that.fadeDuration)
        let colorString = 'hsla(' + value.color + 'deg, 100%, 50%, ' + alpha + ')'
        that.displayCtx.fillStyle = colorString
        that.displayCtx.fillRect(value.col * that.scale, value.row * that.scale, that.scale, that.scale)
      }
    }
    if ( that.curColorI >= 360 ) {
      that.curColorI = 0
    } else {
      that.curColorI = that.curColorI + 10
    }
  },
  captureVideo() {
    var that = this;
    // capture video
    that.captureCtx.drawImage(that.camera, 0, 0, that.captureWidth, that.captureHeight)
    let imgData = that.captureCtx.getImageData(0, 0, that.captureWidth, that.captureHeight).data
    that.processImgData(imgData)
  },
  captureAudio() {
    var that = this;
    that.audioAnalyser.getByteFrequencyData(that.audioFrequencyArray);
    that.processAudioData()
  },
  loop() {
    if ( fVisualizer.inits.video && fVisualizer.inits.audio ) {
      fVisualizer.captureAudio()
      fVisualizer.captureVideo()
      fVisualizer.render()
      window.requestAnimationFrame(fVisualizer.loop)
    }
  },
  initDisplay() {
    let that = this
    that.displayCtx = that.displayCanvas.getContext('2d')
    that.displayWidth = that.captureWidth * that.scale
    that.displayHeight = that.captureHeight * that.scale
  },
  initVideo() {
    let that = this
    that.captureCtx = that.captureCanvas.getContext('2d')
    navigator.mediaDevices.getUserMedia({video: true})
      .then(function(stream) {
        that.camera.srcObject = stream
        that.camera.onloadedmetadata = function(e) {
          that.camera.play()
        }
      }).catch(function() {
        alert('could not connect stream')
      })
    that.camera.addEventListener('play', function () {
      that.inits.video = true
      that.loop()
    }, 0);
  },
  initAudio(stream) {
    window.persistAudioStream = stream
    var audioContent = new AudioContext();
    var audioStream = audioContent.createMediaStreamSource( stream );
    fVisualizer.audioAnalyser = audioContent.createAnalyser();
    audioStream.connect(fVisualizer.audioAnalyser);
    fVisualizer.audioAnalyser.fftSize = 64
    fVisualizer.audioFrequencyArray = new Uint8Array(fVisualizer.audioAnalyser.frequencyBinCount);
    fVisualizer.inits.audio = true
    fVisualizer.loop()
  },
  audioFailed() {
    console.log('audio connection failed')
  },
  init() {
    let that = this
    fVisualizer.initDisplay()
    that.initVideo();
    navigator.getUserMedia({audio:true}, that.initAudio, that.audioFailed);
  }
}
fVisualizer.init();
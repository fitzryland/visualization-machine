import easing from './easing'

var fPixelArto = {
  camera: document.getElementById('js-camera'),
  captureCanvas: document.getElementById('js-capture_canvas'),
  displayCanvas: document.getElementById('js-display_canvas'),
  options: {
    motion: true,
    audio: true,
    image: true
  },
  displayCtx: false,
  captureCtx: false,
  audioAnalyser: false,
  audioFrequencyArray: false,
  fftSize: 256,
  inits: {
    audio: false,
    video: false
  },
  captureWidth: 17,
  captureHeight: 23,
  displayWidth: false,
  displayHeight: false,
  scale: 20,
  prevImg: false,
  pixels: [],
  pixelsAudio: [],
  pixelsImage: [],
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
  randomInt(min, max) {
    // min & max inclusive
    return Math.floor(Math.random() * ( max - min + 1 ) + min)
  },
  isInsideCircle(x1, y1, x2, y2, r) {
    var xs = x2 - x1;
    var ys = y2 - y1;
    xs *= xs;
    ys *= ys;
    var dist = Math.sqrt( xs + ys )
    var abs = Math.abs( dist - r )
    // return ( r >= dist ? true : false )
    return ( abs <= 1 ? true : false )
  },
  plotImage(imgData) {
    var that = this
    for ( var row = 0; row < that.captureHeight; row++ ) {
      for ( var col = 0; col < that.captureWidth; col++ ) {
        let key = row + '_' + col
        let position = (col + row * that.captureWidth) * 4
        that.pixelsImage[key] = {
          row: row,
          col: that.captureWidth - 1 - col,
          r: imgData[position],
          g: imgData[position + 1],
          b: imgData[position + 2],
        }
      }
    }
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
    for (var i = 0 ; i < (that.fftSize/2); i++) {
      var row = that.randomInt(0, that.captureHeight)
      var col = that.randomInt(0, that.captureWidth)
      var key = row + '_' + col
      // var col = Math.round(that.mapRange( i, 0, 31, 0, that.captureWidth )) // hue
      var size = that.audioFrequencyArray[i]
      if ( size > 200 ) {
        that.pixelsAudio[key] = {
          row: row,
          col: col,
          size: that.audioFrequencyArray[i],
          freq: i,
          birth: time
        }
      }
    }
  },
  renderVideo() {
    let that = this
    let now = Date.now()
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
  renderAudio() {
    let that = this
    let now = Date.now()
    for (const [key, value] of Object.entries(that.pixelsAudio)) {
      if ( now - value.birth >= that.fadeDuration ) {
        that.pixelsAudio[key] = []
      } else if ( 'birth' in value ) {
        let h = that.mapRange( value.freq, 0, 31, 255, 360 )
        let l = that.mapRange(value.size, 0, 255, 10, 50)
        let a = easing.easeOutQuad(now - value.birth, 1, -1, that.fadeDuration)
        let r = easing.easeOutQuad(now - value.birth, 1, 5, that.fadeDuration/2)
        let colorString = 'hsla(' + h + 'deg, 100%, ' + l + '%, ' + a + ')'
        that.displayCtx.fillStyle = colorString
        // loop through rows and columns
        // if the cell is inside the circle color it
        for ( var row = 0; row < that.captureHeight; row++ ) {
          for ( var col = 0; col < that.captureWidth; col++ ) {
            if ( that.isInsideCircle( col, row, value.col, value.row, r ) ) {
              that.displayCtx.fillRect(col * that.scale, row * that.scale, that.scale, that.scale)
            }
          }
        }
      }
    }
  },
  renderImage() {
    var that = this;
    for (const [key, value] of Object.entries(that.pixelsImage)) {
      that.displayCtx.fillStyle = `rgb(${value.r}, ${value.g}, ${value.b})`
      that.displayCtx.fillRect(value.col * that.scale, value.row * that.scale, that.scale, that.scale)
    }
  },
  render() {
    var that = this
    that.displayCtx.clearRect(0, 0, that.displayWidth, that.displayHeight)
    that.renderImage()
    that.renderAudio()
    that.renderVideo()
  },
  captureVideo() {
    var that = this;
    // capture video
    that.captureCtx.drawImage(that.camera, 0, 0, that.captureWidth, that.captureHeight)
    let imgData = that.captureCtx.getImageData(0, 0, that.captureWidth, that.captureHeight).data
    that.plotImage(imgData)
    that.processImgData(imgData)
  },
  captureAudio() {
    var that = this;
    that.audioAnalyser.getByteFrequencyData(that.audioFrequencyArray);
    that.processAudioData()
  },
  loop() {
    if (
        ( fPixelArto.inits.video || !fPixelArto.options.motion )
        &&
        ( fPixelArto.inits.audio || !fPixelArto.options.audio )
      ) {
      if ( fPixelArto.options.audio ) {
        fPixelArto.captureAudio()
      }
      if ( fPixelArto.options.motion ) {
        fPixelArto.captureVideo()
      }
      fPixelArto.render()
      window.requestAnimationFrame(fPixelArto.loop)
    }
  },
  initDisplay() {
    let that = this
    that.displayCtx = that.displayCanvas.getContext('2d')
    that.displayWidth = that.captureWidth * that.scale
    that.displayHeight = that.captureHeight * that.scale
    // you have to set explicit dimensions on the
    // display canvas in order for it to render correctly
    that.displayCanvas.width = that.displayWidth
    that.displayCanvas.height = that.displayHeight
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
    fPixelArto.audioAnalyser = audioContent.createAnalyser();
    audioStream.connect(fPixelArto.audioAnalyser);
    fPixelArto.audioAnalyser.fftSize = fPixelArto.fftSize
    fPixelArto.audioFrequencyArray = new Uint8Array(fPixelArto.audioAnalyser.frequencyBinCount);
    fPixelArto.inits.audio = true
    fPixelArto.loop()
  },
  audioFailed() {
    console.log('audio connection failed')
  },
  init() {
    let that = this
    that.initDisplay()
    if ( that.options.motion ) {
      that.initVideo()
    }
    if ( that.options.audio ) {
      navigator.getUserMedia({audio:true}, that.initAudio, that.audioFailed)
    }
  }
}
fPixelArto.init()
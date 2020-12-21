import easing from './easing'

var fVisualizer = {
  camera: document.getElementById('js-camera'),
  captureCanvas: document.getElementById('js-capture_canvas'),
  displayCanvas: document.getElementById('js-display_canvas'),
  displayCtx: false,
  captureCtx: false,
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
            let key = row + '_' + col;
            that.pixels[key] = {
              row: row,
              col: that.captureWidth - 1 - col,
              birth: time
            }
          }
        }
      }
    }
    that.prevImg = imgData
  },
  render() {
    let that = this
    let now = Date.now()
    that.displayCtx.clearRect(0, 0, that.displayWidth, that.displayHeight)
    for (const [key, value] of Object.entries(that.pixels)) {
      // console.log('key', key)
      // t: current time, b: begInnIng value, c: change In value, d: duration
      if ( now - value.birth >= that.fadeDuration ) {
        that.pixels[key] = []
      } else if ( 'birth' in value ) {
        if ( !('color' in value) ) {
          that.pixels[key].color = that.curColorI
        }
        let alpha = easing.easeOutQuad(now - value.birth, 1, -1, that.fadeDuration)
        let colorString = 'hsla(' + value.color + 'deg, 100%, 50%, ' + alpha + ')'
        if ( key === '9_29' ) {
          colorString
        }
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
  capture() {
    var that = this;
    // capture video
    that.captureCtx.drawImage(that.camera, 0, 0, that.captureWidth, that.captureHeight)
    let imgData = that.captureCtx.getImageData(0, 0, that.captureWidth, that.captureHeight).data
    that.processImgData(imgData)
  },
  loop() {
    fVisualizer.capture()
    fVisualizer.render()
    window.requestAnimationFrame(fVisualizer.loop)
  },
  init() {
    let that = this
    that.captureCtx = that.captureCanvas.getContext('2d')
    that.displayCtx = that.displayCanvas.getContext('2d')
    that.displayWidth = that.captureWidth * that.scale
    that.displayHeight = that.captureHeight * that.scale
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
      that.loop()
    }, 0);
  }
}
fVisualizer.init();
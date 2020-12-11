import easing from './easing'

var fVisualizer = {
  camera: document.getElementById('js-camera'),
  captureCanvas: document.getElementById('js-capture_canvas'),
  htmlDisplay: document.getElementById('js-html_display'),
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
    if ( Math.abs(a - b) > 100 ) {
      return true;
    } else {
      return false;
    }
  },
  plotChange(row, col, time) {
    let that = this;
    that.pixels.push({
      row: row,
      col: col,
      birth: time,
    })
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
            that.plotChange(row, col, time)
          }
        }
      }
    }
    that.prevImg = imgData
  },
  render() {
    let that = this
    let pixelsLength = that.pixels.length
    let now = Date.now()
    let colorString = 'hsl(' + that.curColorI + 'deg, 100%, 50%)'
    for ( let i = 0; i < pixelsLength; i++ ) {
      let curPix = that.pixels[i]
      let pixel = document.createElement('div')
      pixel.className = 'pixel'
      pixel.style.width = that.scale + 'px'
      pixel.style.height = that.scale + 'px'
      pixel.style.left = that.displayWidth - that.scale - (curPix.col * that.scale) + 'px'
      pixel.style.top = (curPix.row * that.scale) + 'px'
      pixel.style.backgroundColor = colorString
      that.htmlDisplay.appendChild(pixel)
      setTimeout(() => {
        pixel.remove()
      }, 1000)
    }
    that.pixels = []
    if ( that.curColorI >= 360 ) {
      that.curColorI = 0
    } else {
      that.curColorI = that.curColorI + 10
    }
  },
  capture() {
    var that = this;
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
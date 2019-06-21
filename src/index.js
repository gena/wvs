import './styles.css'
var _ = require('lodash')

class VideoSystem {
  constructor(selector) {
    // HTML collection of all  the video elements in the page
    // use  container or css class to select all relevant videos
    this.videos = document.querySelectorAll(selector)
    this.maxDrift = 0.05 // in [s], TODO: switch to frames?
    this.lastSync = 0 // in ms
    this.drifts = []
    this.throttle = 100 // in ms
    this.fps = 10

    // Register sync loop?
    // requestAnimationFrame
    // setInterval?
  }

  sync(t) {
    // loop  over all the videos and keep them in sync with the main video
    let deltaSync = t - this.lastSync

    // If we synced less than 1 second ago, don't sync
    if (deltaSync < this.throttle) {
      return
    }

    let first = this.videos[0]

    if (this.onTimeChangeCallback) {
      this.onTimeChangeCallback(first.currentTime)
    }

    if (first.duration - first.currentTime < this.maxDrift) {
      return
    }
    // sync all status of videos to first
    let drifts = []
    this.videos.forEach(other => {
      let drift = other.currentTime - first.currentTime
      drifts.push(drift)
      if (first === other) {
        // don't sync yourself
        return
      }
      if (!first.paused && other.paused) {
        // it should have been started
        other.play()
      }
      if (first.paused && !other.paused) {
        // it should have paused
        other.pause()
      }
    })

    this.videos.forEach((other, i) => {
      // TODO don't sync near end of the video
      let drift = drifts[i]
      if (drift > this.maxDrift) {
        //  TODO: add robust drift estimate and add it here.
        other.currentTime = first.currentTime
      }
    })
    this.drifts = drifts
    this.lastSync = t
    this.setClasses()
  }

  setClasses() {
    let first = this.videos[0]
    // The first element is the 'master' element
    first.classList.add('master')

    this.videos.forEach((other, i) => {
      if (i === 0) {
        return
      }
      let drift = this.drifts[i]
      if (Math.abs(drift) > this.maxDrift) {
        // TODO: assimilate
        // set classes to video and color by drift
        other.classList.remove('in-sync')
        other.classList.add('out-of-sync')
        if (other.currentTime > first.currentTime) {
          other.classList.add('ahead')
        } else {
          other.classList.add('behind')
        }
      } else {
        other.classList.remove('out-of-sync')
        other.classList.add('in-sync')
      }
    })
  }

  play() {
    if (!this.videos[0].paused) {
      return
    }

    this.videos.forEach(v => {
      v.play()
    })
  }

  pause() {
    if (this.videos[0].paused) {
      return
    }

    this.videos.forEach(v => {
      v.pause()
    })
  }

  syncLoop() {
    // This might break everything
    let doSync = t => {
      // request the next sync
      requestAnimationFrame(doSync)
      // sync now
      this.sync(t)
    }

    // start the sync loop
    doSync()
  }

  setTime(t) {
    this.videos.forEach(v => {
      v.currentTime = t
    })
  }

  setFrame(frame) {
    this.videos.forEach(v => {
      v.currentTime = (frame - 1) / this.fps + 0.01
    })
  }

  setSpeed(speed) {
    this.videos.forEach(v => {
      v.playbackRate = speed
    })
  }

  onTimeChange(cb) {
    this.onTimeChangeCallback = cb
  }
}

let videoSystem = new VideoSystem('#app video')

let sliderSpeed = document.getElementById('speed-slider')
let valueSpeed = document.getElementById('speed-value')
sliderSpeed.addEventListener('input', e => {
  valueSpeed.innerText = parseFloat(e.target.value).toFixed(1) + 'x'
  videoSystem.setSpeed(e.target.value)
})

let sliderMaxDrift = document.getElementById('max-drift-slider')
let valueMaxDrift = document.getElementById('max-drift-value')
sliderMaxDrift.addEventListener('input', e => {
  videoSystem.maxDrift = e.target.value
  valueMaxDrift.innerText = e.target.value + ' sec'
})

let sliderFrame = document.getElementById('frame-slider')
let valueFrame = document.getElementById('frame-value')
videoSystem.onTimeChange(t => {
  let frame = Math.floor(t * videoSystem.fps + 1)
  valueFrame.innerText = frame
  sliderFrame.value = frame
})

let onCurrentFrameSlide = _.throttle(function(e) {
  videoSystem.setFrame(e.target.value)
  valueFrame.innerText = e.target.value
}, 150)

sliderFrame.addEventListener('input', e => onCurrentFrameSlide(e))

let app = document.getElementById('app')
let debugCheckbox = document.getElementById('debug-checkbox')
debugCheckbox.addEventListener('change', evt => {
  if (evt.target.checked) {
    app.classList.add('debug')
  } else {
    app.classList.remove('debug')
  }
})

let playCheckbox = document.getElementById('play-checkbox')
playCheckbox.addEventListener('change', evt => {
  if (evt.target.checked) {
    videoSystem.play()
  } else {
    videoSystem.pause()
  }
})

videoSystem.setSpeed(sliderSpeed.value)

videoSystem.play()
// videoSystem.syncLoop()
// setTimeout(() => videoSystem.sync(), 500)
setTimeout(() => videoSystem.sync(), 1000)
// setTimeout(() => videoSystem.sync(), 2000)
// setTimeout(() => videoSystem.sync(), 3000)

videoSystem.syncLoop()
app.classList.remove('debug')

// setTimeout(() => console.log(videoSystem.drifts), 3000)
// setTimeout(() => console.log(videoSystem.drifts), 8000)

document.body.onkeyup = function(e) {
  if (e.keyCode === 32) {
    if (playCheckbox.checked) {
      playCheckbox.checked = false
      videoSystem.pause()
    } else {
      playCheckbox.checked = true
      videoSystem.play()
    }
  }
}

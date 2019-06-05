import './styles.css'

class VideoSystem {
  constructor(selector) {
    // HTML collection of all  the video elements in the page
    // use  container or css class to select all relevant videos
    this.videos = document.querySelectorAll(selector)
    this.maxDrift = 0.1 // in [s]
    this.lastSync = 0 // in ms
    this.drifts = []
    this.throttle = 200 // in ms
    this.fixedDrift = 0

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
        other.currentTime = first.currentTime + this.fixedDrift
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
    this.videos.forEach(v => {
      // do we play all or just the first?
      v.play()
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

  pause() {
    this.videos.forEach(v => {
      // do we play all or just the first?
      v.pause()
    })
  }
  setTime(t) {
    this.videos.forEach(v => {
      v.currentTime = t
    })
  }

  setSpeed(speed) {
    this.videos.forEach(v => {
      v.playbackRate = speed
    })
  }
}

let slider = document.getElementById('slider')
slider.addEventListener('input', () => {
  videoSystem.setSpeed(slider.value)
})

let maxDriftSlider = document.getElementById('max-drift')
maxDriftSlider.addEventListener('change', evt => {
  videoSystem.maxDrift = evt.target.value
})

let debugCheckbox = document.getElementById('debug')
debugCheckbox.addEventListener('change', evt => {
  console.log('debug', evt.target.value)
  let app = document.getElementById('app')
  if (evt.target.checked) {
    app.classList.add('debug')
  } else {
    app.classList.remove('debug')
  }
})

let videoSystem = new VideoSystem('#app video')
videoSystem.fixedDrift = 0.04
videoSystem.play()
// videoSystem.syncLoop()
// setTimeout(() => videoSystem.sync(), 1000)
// setTimeout(() => videoSystem.sync(), 2000)
// setTimeout(() => videoSystem.sync(), 3000)

videoSystem.syncLoop()
setTimeout(() => console.log(videoSystem.drifts), 3000)
setTimeout(() => console.log(videoSystem.drifts), 8000)

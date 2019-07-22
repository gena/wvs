class VideoSystem {
  constructor(selector) {
    // HTML collection of all  the video elements in the page
    // use  container or css class to select all relevant videos
    this.videos = document.querySelectorAll(selector)
    this.maxDrift = 0.05 // in [s], TODO: switch to frames?
    this.lastSync = 0 // in ms
    this.drifts = []
    this.throttle = 100 // in ms
    this.fps = 25
    // Create an element to fire events on
    this.el = document.createElement('div')

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
    let currentTimes = []
    this.videos.forEach(other => {
      let drift = other.currentTime - first.currentTime
      currentTimes.push(other.currentTime)
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
    let event = new CustomEvent('timeupdate', {
      detail: {
        videos: this.videos,
        drifts,
        currentTimes
      }
    })
    this.el.dispatchEvent(event)
  }
  on(eventType, callback) {
    // TODO: add off function
    this.el.addEventListener(eventType, callback)
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

function setClasses(system) {
  // Function to visually show debug information on the video elements
  let first = system.videos[0]
  // The first element is the 'master' element
  first.classList.add('master')

  system.videos.forEach((other, i) => {
    if (i === 0) {
      return
    }
    let drift = system.drifts[i]
    if (Math.abs(drift) > system.maxDrift) {
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
export { VideoSystem, setClasses }

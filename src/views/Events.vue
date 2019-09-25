<template>
<div class="events">
  <div id="map"></div>
  </div>
</template>

<script>
// @ is an alias to /src

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Canvas Tiles (I left out the video so  I can easier  test, but the  essence is the same)
const CanvasLayer = L.GridLayer.extend({
  onAdd (map) {
    // give the container an interactive class
    // make sure you call  the onAdd method from the GridLayer first (so we have a _container)
    // we're extending this method, not overwriting it
    L.GridLayer.prototype.onAdd.call(this, map)
    // now add the class
    L.DomUtil.addClass(this._container, 'leaflet-interactive')
  },
  createTile (coords) {
    // create a <canvas> element for drawing
    var tile = L.DomUtil.create('canvas', 'leaflet-tile')
    // this is new, add the leaflet-interactive class, this will set the appropriate cursor
    L.DomUtil.addClass(tile, 'leaflet-interactive')
    // this is the thing you need to do to make a layer interactive (register the tile, in the list of elements that you can listen to)
    this.addInteractiveTarget(tile)

    // This is not new
    // setup tile width and height according to the options
    var size = this.getTileSize()
    tile.width = size.x
    tile.height = size.y

    // return the tile so it can be rendered on screen
    return tile
  }
})

export default {
  name: 'events',
  mounted () {
    // Just make a normal map
    let map = L.map('map')
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
    map.setView([40.72, -74.2], 10)

    // now add our super shiny canvas tile map
    let tileLayer = this.makeTileLayer()
    tileLayer.addTo(map)
  },
  methods: {
    makeTileLayer () {
      // just a normal extended GridLayer
      let tileLayer = new CanvasLayer()

      // now we can listen to custom events
      tileLayer.on('click', (evt) => {
        // get the element
        let canvas = evt.originalEvent.target
        // get the context
        let ctx = canvas.getContext('2d')
        // get the coordinate of the click (inside the current canvas)
        let x = evt.originalEvent.offsetX
        let y = evt.originalEvent.offsetY
        // get the color
        var data = ctx.getImageData(x, y, 1, 1).data
        // lookup rgb
        var rgb = [ data[0], data[1], data[2] ]
        // show rgb  value
        console.log('click', evt, rgb)
      })
      tileLayer.on('mousemove', (evt) => {
        // another example with  hover
        let canvas = evt.originalEvent.target
        // get the element and context again
        let ctx = canvas.getContext('2d')
        ctx.beginPath()
        // draw a circle so you can see what's happening and don't flood the log
        // the only  way to get the coordinate in the context of the current tile is from the original event
        var r = Math.floor(Math.random() * 255)
        var g = Math.floor(Math.random() * 255)
        var b = Math.floor(Math.random() * 255)

        var cssColor = `rgb(${r},${g},${b})`
        ctx.fillStyle = cssColor
        ctx.arc(evt.originalEvent.offsetX, evt.originalEvent.offsetY, 5, 0, Math.PI * 2)
        ctx.fill()
      })
      return tileLayer
    }
  }

}
</script>
<style>
#map {
  width: 80vw;
  height: 80vh;
}
#map canvas {
  border: 1px solid red;
  z-index: 1000;
}
#map .leaflet-interactive .leaflet-tile-container {
  pointer-events: initial;
}
</style>

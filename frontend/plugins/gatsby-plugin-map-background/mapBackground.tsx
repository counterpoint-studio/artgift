import React, { useRef, useEffect, useState } from "react"
import mapboxgl, { LngLatBoundsLike } from "mapbox-gl"

import "./mapBackground.scss"

mapboxgl.accessToken = process.env.GATSBY_MAPBOX_ACCESS_TOKEN

export interface MapBackgroundProps {
  bounds?: LngLatBoundsLike
  boundsPadding?: number
  regions?: { feature: GeoJSON.Feature; bounds: mapboxgl.LngLatBoundsLike }[]
  points?: [number, number][]
  onSetMoving: (moving: boolean) => void
}

const MapBackground: React.FC<MapBackgroundProps> = ({
  bounds,
  boundsPadding,
  regions,
  points,
  onSetMoving,
}) => {
  let mapEl = useRef<HTMLDivElement>()
  let [map, setMap] = useState<mapboxgl.Map>()
  let firstTransition = useRef(true)

  useEffect(function initMap() {
    let map = new mapboxgl.Map({
      container: mapEl.current,
      style: "mapbox://styles/teropa/ckbc1rriu0mcx1inu9wlkna38",
      zoom: 7,
      pitch: 45,
      attributionControl: false,
    }).addControl(new mapboxgl.AttributionControl({ compact: false }))
    setMap(map)
  }, [])

  useEffect(() => {
    if (!map) return
    let onMoveStart = () => onSetMoving(true)
    let onMoveEnd = () => onSetMoving(false)
    let attach = () => {
      map.on("movestart", onMoveStart)
      map.on("moveend", onMoveEnd)
      if (map.isMoving()) {
        onSetMoving(true)
      } else {
        onSetMoving(false)
      }
    }
    if (map.loaded()) {
      attach()
    } else {
      map.once("load", attach)
    }
    return () => {
      map.off("movestart", onMoveStart)
      map.off("moveend", onMoveEnd)
    }
  }, [map, onSetMoving])

  useEffect(() => {
    if (!bounds) return
    map?.fitBounds(bounds, {
      pitch: 0,
      padding: boundsPadding ?? 0,
      duration: firstTransition.current ? 5000 : 2000,
    })
    firstTransition.current = false
  }, [map, bounds, boundsPadding])

  useEffect(
    function updateRegions() {
      if (!map || !regions) return
      let added = false
      function add() {
        added = true
        if (map.getSource("regions")) {
          let src = map.getSource("regions") as mapboxgl.GeoJSONSource
          src.setData({
            type: "FeatureCollection",
            features: regions.map(r => r.feature),
          })
        } else {
          map.addSource("regions", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: regions.map(r => r.feature),
            },
          })
          map.addLayer({
            id: "regions",
            type: "line",
            source: "regions",
          })
        }
      }
      if (map.isStyleLoaded()) {
        add()
      } else {
        map.once("style.load", add)
      }

      return () => {
        if (added) {
          map.removeLayer("regions")
          map.removeSource("regions")
        } else {
          map.off("style.load", add)
        }
      }
    },
    [map, regions]
  )

  useEffect(() => {
    if (!points || !map) return

    let running = true,
      markers: mapboxgl.Marker[] = [],
      pts = points.slice()
    function addNext() {
      if (!running || pts.length === 0) return
      let markerEl = document.createElement("div")
      markerEl.classList.add("pointMarker")
      markers.push(
        new mapboxgl.Marker(markerEl).setLngLat(pts.shift()).addTo(map)
      )
      setTimeout(() => markerEl.classList.add("isAdded"))
      setTimeout(addNext, Math.random() * 30)
    }
    setTimeout(addNext, 2000)

    return () => {
      running = false
      markers.forEach(m => m.remove())
    }
  }, [points, map])

  return <div ref={mapEl} className="mapBackground"></div>
}

export default MapBackground

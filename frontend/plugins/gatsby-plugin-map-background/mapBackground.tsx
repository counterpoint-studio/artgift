import React, { useRef, useEffect, useState } from "react"
import mapboxgl, { LngLatBoundsLike } from "mapbox-gl"
import { useWindowSize } from "@react-hook/window-size"

import "./mapBackground.scss"

mapboxgl.accessToken = process.env.GATSBY_MAPBOX_ACCESS_TOKEN

const INITIAL_ZOOM_LEVEL = 4
const INITIAL_PITCH_ANGLE = 45
const FINAL_PITCH_ANGLE = 0
const FIRST_ZOOM_DURATION_MS = 5_000
const SUBSEQUENT_ZOOM_DURATION_MS = 2_000
const FIRST_POINT_ENTER_DELAY_MS = 3_000
const MIN_POINT_ENTER_DELAY_MS = 0
const MAX_POINT_ENTER_INTERVAL_MS = 20
const LAST_POINT_ENTER_DELAY_MS = 1_000

export interface MapBackgroundProps {
  bounds?: LngLatBoundsLike
  boundsPadding?: number
  isSplitScreen?: boolean
  regions?: {
    name: string
    status: "available" | "unavailable"
    feature: GeoJSON.Feature
  }[]
  points?: { id: string; location: [number, number] }[]
  focusPoint?: { className: string; location: [number, number] }
  onSetMoving: (moving: boolean) => void
}

const MapBackground: React.FC<MapBackgroundProps> = ({
  bounds,
  boundsPadding,
  isSplitScreen,
  regions,
  points,
  focusPoint,
  onSetMoving,
}) => {
  let [windowWidth, windowHeight] = useWindowSize()
  let mapEl = useRef<HTMLDivElement>()
  let [map, setMap] = useState<mapboxgl.Map>()
  let [addingPoints, setAddingPoints] = useState(false)
  let [moving, setMoving] = useState(false)
  let firstTransition = useRef(true)
  let pointMarkers = useRef<{ id: string; marker: mapboxgl.Marker }[]>([])
  let focusPointMarker = useRef<mapboxgl.Marker>()

  useEffect(function initMap() {
    let map = new mapboxgl.Map({
      container: mapEl.current,
      style: "mapbox://styles/teropa/ckbc1rriu0mcx1inu9wlkna38",
      zoom: INITIAL_ZOOM_LEVEL,
      pitch: INITIAL_PITCH_ANGLE,
      attributionControl: false,
    }).addControl(new mapboxgl.AttributionControl({ compact: false }))
    setMap(map)
  }, [])
  useEffect(
    function setPadding() {
      if (!map) return
      map.setPadding({
        left: windowWidth > 768 ? 500 : 0,
        top: 0,
        right: 0,
        bottom: isSplitScreen ? windowHeight / 2 : 0,
      })
    },
    [map, windowWidth, windowHeight, isSplitScreen]
  )

  useEffect(() => {
    if (!map) return
    let onMoveStart = () => setMoving(true)
    let onMoveEnd = () => setMoving(false)
    let attach = () => {
      map.on("movestart", onMoveStart)
      map.on("moveend", onMoveEnd)
      if (map.isMoving()) {
        setMoving(true)
      } else {
        setMoving(false)
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
  }, [map])

  useEffect(() => {
    if (!bounds) return
    map?.fitBounds(bounds, {
      pitch: FINAL_PITCH_ANGLE,
      padding: boundsPadding ?? 0,
      duration: firstTransition.current
        ? FIRST_ZOOM_DURATION_MS
        : SUBSEQUENT_ZOOM_DURATION_MS,
    })
    firstTransition.current = false
  }, [map, bounds, boundsPadding])

  useEffect(
    function updateRegions() {
      if (!map || !regions) return
      function add(
        name: string,
        status: "available" | "unavailable",
        region: GeoJSON.Feature
      ) {
        map.addSource(`region-${name}`, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [region],
          },
        })
        if (status === "available") {
          map.addLayer({
            id: `region-${name}`,
            type: "line",
            source: `region-${name}`,
            paint: {
              "line-width": 3,
              "line-color": "#ffffff",
            },
          })
        } else {
          map.addLayer({
            id: `region-${name}`,
            type: "fill",
            source: `region-${name}`,
            paint: {
              "fill-opacity": 0.2,
              "fill-color": "#000000",
            },
          })
        }
      }

      let addTimeouts: number[] = []
      let loaded = map.isStyleLoaded()
      for (let region of regions) {
        if (loaded) {
          add(region.name, region.status, region.feature)
        } else {
          let waiting = () => {
            if (!map.isStyleLoaded()) {
              addTimeouts.push(setTimeout(waiting, 200))
            } else {
              add(region.name, region.status, region.feature)
            }
          }
          waiting()
        }
      }

      return () => {
        addTimeouts.forEach(clearTimeout)
        for (let region of regions) {
          if (map.getLayer(`region-${region.name}`)) {
            map.removeLayer(`region-${region.name}`)
            map.removeSource(`region-${region.name}`)
          }
        }
      }
    },
    [map, regions]
  )

  useEffect(
    function updatePoints() {
      if (!points || !map) return

      let newPoints = points.filter(
          pt => !pointMarkers.current.find(m => m.id === pt.id)
        ),
        removedPointMarkers = pointMarkers.current.filter(
          m => !points.find(p => p.id === m.id)
        )

      for (let removed of removedPointMarkers) {
        removed.marker.remove()
        pointMarkers.current.splice(pointMarkers.current.indexOf(removed), 1)
      }

      function addNext() {
        if (newPoints.length === 0) {
          return
        }
        let point = newPoints.shift()
        let markerEl = document.createElement("div")
        markerEl.classList.add("pointMarker")
        let marker = new mapboxgl.Marker(markerEl)
          .setLngLat(point.location)
          .addTo(map)
        pointMarkers.current.push({ id: point.id, marker })
        let isLast = newPoints.length === 0
        setTimeout(() => {
          markerEl.classList.add("isAdded")
          if (isLast) {
            setTimeout(() => setAddingPoints(false), LAST_POINT_ENTER_DELAY_MS)
          }
        })
        setTimeout(
          addNext,
          MIN_POINT_ENTER_DELAY_MS +
            Math.random() *
              (MAX_POINT_ENTER_INTERVAL_MS - MIN_POINT_ENTER_DELAY_MS)
        )
      }
      if (newPoints.length > 0) {
        setAddingPoints(true)
        setTimeout(addNext, FIRST_POINT_ENTER_DELAY_MS)
      }
    },
    [points, map]
  )

  useEffect(
    function updateFocusPoint() {
      if (!map) return

      if (focusPoint) {
        if (!focusPointMarker.current) {
          let markerEl = document.createElement("div")
          focusPointMarker.current = new mapboxgl.Marker(markerEl)
            .setLngLat(focusPoint.location)
            .addTo(map)
        }
        focusPointMarker.current.setLngLat(focusPoint.location)
        let markerEl = focusPointMarker.current.getElement()
        for (let cls of Array.from(markerEl.classList)) {
          markerEl.classList.remove(cls)
        }
        markerEl.classList.add("focusPointMarker")
        markerEl.classList.add(focusPoint.className)
      } else {
        if (focusPointMarker.current) {
          focusPointMarker.current.remove()
          focusPointMarker.current = undefined
        }
      }
    },
    [focusPoint, map]
  )

  useEffect(
    function notifyMovement() {
      onSetMoving(moving || addingPoints)
    },
    [moving, addingPoints, onSetMoving]
  )

  return <div ref={mapEl} className="mapBackground"></div>
}

export default MapBackground

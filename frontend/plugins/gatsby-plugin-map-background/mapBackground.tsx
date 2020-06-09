import React, { useRef, useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"

import "./mapBackground.scss"

mapboxgl.accessToken = process.env.GATSBY_MAPBOX_ACCESS_TOKEN

export interface MapBackgroundProps {
  center?: [number, number]
}

const MapBackground: React.FC<MapBackgroundProps> = ({ center }) => {
  let mapEl = useRef<HTMLDivElement>()
  let [map, setMap] = useState<mapboxgl.Map>()

  useEffect(function initMap() {
    let map = new mapboxgl.Map({
      container: mapEl.current,
      style: "mapbox://styles/mapbox/streets-v11",
      zoom: 9,
      attributionControl: false,
    }).addControl(new mapboxgl.AttributionControl({ compact: false }))
    setMap(map)
  }, [])

  useEffect(() => {
    map?.setCenter(center)
  }, [map, center])

  return <div ref={mapEl} className="mapBackground"></div>
}

export default MapBackground

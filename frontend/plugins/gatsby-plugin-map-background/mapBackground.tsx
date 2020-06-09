import React, { useRef, useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"
import { Polygon } from "geojson"

import "./mapBackground.scss"

mapboxgl.accessToken = process.env.GATSBY_MAPBOX_ACCESS_TOKEN

export interface MapBackgroundProps {
  center?: [number, number]
  regions?: GeoJSON.FeatureCollection
  focusedRegion?: GeoJSON.Feature
}

const MapBackground: React.FC<MapBackgroundProps> = ({
  center,
  regions,
  focusedRegion,
}) => {
  let mapEl = useRef<HTMLDivElement>()
  let [map, setMap] = useState<mapboxgl.Map>()

  useEffect(function initMap() {
    let map = new mapboxgl.Map({
      container: mapEl.current,
      style: "mapbox://styles/mapbox/streets-v11",
      zoom: 7,
      pitch: 45,
      attributionControl: false,
    }).addControl(new mapboxgl.AttributionControl({ compact: false }))
    map.once("load", () => {
      map.easeTo({ zoom: 9, pitch: 0, duration: 10000 })
    })
    setMap(map)
  }, [])

  useEffect(() => {
    map?.setCenter(center)
  }, [map, center])

  useEffect(
    function updateRegions() {
      if (!map || !regions) return
      let added = false
      function add() {
        added = true
        if (map.getSource("regions")) {
          let src = map.getSource("regions") as mapboxgl.GeoJSONSource
          src.setData(regions)
        } else {
          map.addSource("regions", {
            type: "geojson",
            data: regions,
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
          map.off("style.load", add)
        } else {
          map.removeLayer("regions")
          map.removeSource("regions")
        }
      }
    },
    [map, regions]
  )

  useEffect(
    function focusOnRegion() {
      if (!focusedRegion || !map) return
      let poly = focusedRegion.geometry as Polygon
      let bounds = poly.coordinates.reduce(
        (bounds, coords) =>
          coords.reduce(
            (bounds, coord) => bounds.extend(coord as [number, number]),
            bounds
          ),
        new mapboxgl.LngLatBounds()
      )
      map.fitBounds(bounds)
    },
    [focusedRegion, map]
  )

  return <div ref={mapEl} className="mapBackground"></div>
}

export default MapBackground

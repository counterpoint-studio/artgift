import React, { useState } from "react"
import MapBackground, { MapBackgroundProps } from "./mapBackground"
import { MapBackgroundContext } from "./mapBackgroundContext"

const MapBackgroundContextWrapper = ({ element }) => {
  let [props, setProps] = useState<MapBackgroundProps>()

  return (
    <MapBackgroundContext.Provider value={{ ...props, update: setProps }}>
      <MapBackground {...props} />
      {element}
    </MapBackgroundContext.Provider>
  )
}

export default MapBackgroundContextWrapper

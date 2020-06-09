import React, { useState } from "react"
import MapBackground, { MapBackgroundProps } from "./mapBackground"
import { MapBackgroundContext } from "./mapBackgroundContext"

const MapBackgroundContextWrapper = ({ element }) => {
  let [props, setProps] = useState<MapBackgroundProps>()

  return (
    <MapBackgroundContext.Provider
      value={{
        ...props,
        update: newP => setProps(oldP => ({ ...oldP, ...newP })),
      }}
    >
      <MapBackground {...props} />
      {element}
    </MapBackgroundContext.Provider>
  )
}

export default MapBackgroundContextWrapper

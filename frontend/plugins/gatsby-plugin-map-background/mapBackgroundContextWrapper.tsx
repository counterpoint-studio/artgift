import React, { useState } from "react"
import MapBackground, { MapBackgroundProps } from "./mapBackground"
import { MapBackgroundContext } from "./mapBackgroundContext"

const MapBackgroundContextWrapper = ({ element }) => {
  let [props, setProps] = useState<MapBackgroundProps>()
  let [isMoving, setMoving] = useState(true)

  return (
    <MapBackgroundContext.Provider
      value={{
        ...props,
        isMoving,
        update: newP => setProps(oldP => ({ ...oldP, ...newP })),
      }}
    >
      <MapBackground {...props} onSetMoving={setMoving} />
      {element}
    </MapBackgroundContext.Provider>
  )
}

export default MapBackgroundContextWrapper

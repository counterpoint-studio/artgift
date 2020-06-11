import React from "react"
import MapBackgroundContextWrapper from "./mapBackgroundContextWrapper"

export const wrapPageElement = ({ element }) => (
  <MapBackgroundContextWrapper element={element} />
)

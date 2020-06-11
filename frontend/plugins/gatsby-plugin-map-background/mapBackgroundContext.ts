import { createContext } from "react";
import { MapBackgroundProps } from "./mapBackground";

interface MapBackgroundContextAttributes extends MapBackgroundProps {
    update: (props: Partial<MapBackgroundProps>) => void
}

export const MapBackgroundContext = createContext<MapBackgroundContextAttributes>(undefined)
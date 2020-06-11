import { createContext } from "react";
import { MapBackgroundProps } from "./mapBackground";

interface MapBackgroundContextAttributes extends MapBackgroundProps {
    update: (props: Partial<MapBackgroundProps>) => void,
    isMoving: boolean
}

export const MapBackgroundContext = createContext<MapBackgroundContextAttributes>(undefined)
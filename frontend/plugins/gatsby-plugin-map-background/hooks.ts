import { useContext, useEffect } from "react";

import { MapBackgroundProps } from "./mapBackground";
import { MapBackgroundContext } from "./mapBackgroundContext";

export function useMapBackground(props: Partial<MapBackgroundProps>) {
    let ctx = useContext(MapBackgroundContext);

    useEffect(() => {
        ctx.update(props);
    }, [props?.center[0], props?.center[1]])
}

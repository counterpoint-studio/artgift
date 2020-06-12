import { useContext, useEffect } from "react";

import { MapBackgroundProps } from "./mapBackground";
import { MapBackgroundContext } from "./mapBackgroundContext";

export function useMapBackground(props: Partial<MapBackgroundProps>) {
    let ctx = useContext(MapBackgroundContext);

    useEffect(() => {
        ctx.update(props);
    }, [
        props?.bounds?.[0][0],
        props?.bounds?.[0][1],
        props?.bounds?.[1][0],
        props?.bounds?.[1][1],
        props?.regions,
        props?.focusedRegion,
        props?.points
    ])

    return ctx;
}

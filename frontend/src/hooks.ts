import { useEffect, useState } from "react";

export function useMounted() {
    let [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted
}
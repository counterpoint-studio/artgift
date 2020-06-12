import { useEffect, useState } from "react";
import createPersistedState from 'use-persisted-state';
import { Gift } from "./types";

export function useMounted() {
    let [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted
}

export const useGiftState: (initGift: Gift) => [Gift, (newGift: Gift) => void] = createPersistedState(
    'gift',
    typeof window !== 'undefined' ? window.sessionStorage : null
)

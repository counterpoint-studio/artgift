import { useEffect, useRef, useState } from "react"
import createPersistedState from "use-persisted-state"
import { Gift } from "./types"

export function useMounted() {
  let [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}

const usePersistentGiftState: (
  initGift: Gift
) => [
  Gift,
  (newGift: Gift | ((oldGift: Gift) => Gift)) => void
] = createPersistedState(
  "gift",
  typeof window !== "undefined" ? window.sessionStorage : null
)

export const useGiftState = (initGift: Gift) => {
  let [gift, setPersistentGift] = usePersistentGiftState(initGift)
  let persistentSetterRef = useRef<
    (newGift: Gift | ((oldGift: Gift) => Gift)) => void
  >(setPersistentGift)
  useEffect(() => {
    persistentSetterRef.current = setPersistentGift
  }, [setPersistentGift])

  let transientSetter = (v: Gift | ((oldGift: Gift) => Gift)) => {
    return persistentSetterRef.current(v)
  }
  return [gift, transientSetter] as [
    Gift,
    (newGift: Gift | ((oldGift: Gift) => Gift)) => void
  ]
}

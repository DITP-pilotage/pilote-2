import { useSyncExternalStore } from 'react'

import type { ScreenSize } from './views'

// Seuils lg (992 px) et xl (1440 px), comme sur PPG.
const MEDIUM_QUERY = '(min-width: 62em)'
const WIDE_QUERY = '(min-width: 90em)'

// Sans `matchMedia` (jsdom, navigateur ancien), l'écran est traité comme étroit.
const hasMatchMedia = () => typeof window.matchMedia === 'function'

const subscribe = (onChange: () => void) => {
  if (!hasMatchMedia()) return () => undefined
  const medias = [MEDIUM_QUERY, WIDE_QUERY].map((query) => window.matchMedia(query))
  medias.forEach((media) => media.addEventListener('change', onChange))
  return () => medias.forEach((media) => media.removeEventListener('change', onChange))
}

const read = (): ScreenSize => {
  if (!hasMatchMedia()) return 'narrow'
  if (window.matchMedia(WIDE_QUERY).matches) return 'wide'
  if (window.matchMedia(MEDIUM_QUERY).matches) return 'medium'
  return 'narrow'
}

export const useScreenSize = (): ScreenSize => useSyncExternalStore(subscribe, read, () => 'narrow')

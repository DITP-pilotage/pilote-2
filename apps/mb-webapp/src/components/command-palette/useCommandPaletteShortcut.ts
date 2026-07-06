import { useEffect } from 'react'

/**
 * Écoute le raccourci global ⌘K / CTRL+K et appelle `onOpen`.
 * La fermeture (Échap, clic extérieur) est gérée par le Dialog Radix.
 */
export function useCommandPaletteShortcut(onOpen: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpen])
}

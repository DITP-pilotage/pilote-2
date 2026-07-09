import { useEffect } from 'react'

/** Vrai si la cible de l'événement est un champ de saisie (input, textarea, contenteditable). */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * Écoute le raccourci global ⌘K / CTRL+K et appelle `onOpen`.
 * La fermeture (Échap, clic extérieur) est gérée par le Dialog Radix.
 */
export function useCommandPaletteShortcut(onOpen: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        // On n'intercepte pas quand l'utilisateur tape dans un champ, pour ne pas
        // ouvrir la palette de façon surprenante ni bloquer un raccourci natif.
        if (isEditableTarget(event.target)) return
        event.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpen])
}

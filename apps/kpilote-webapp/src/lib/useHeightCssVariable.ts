import { useCallback } from 'react'

// Publie la hauteur d'un élément dans une variable CSS de la page, mise à jour à
// chaque redimensionnement (un en-tête qui passe sur deux lignes, par exemple).
// Renvoie une ref-callback : l'observation commence quand l'élément est attaché,
// quel que soit le moment où il est monté, et s'arrête quand il est détaché.
export const useHeightCssVariable = (
  variable: `--${string}`,
): ((element: HTMLElement | null) => (() => void) | undefined) =>
  useCallback(
    (element: HTMLElement | null) => {
      if (!element) return undefined
      const root = document.documentElement
      const observer = new ResizeObserver(([entry]) => {
        if (!entry) return
        root.style.setProperty(variable, `${entry.borderBoxSize[0]?.blockSize ?? 0}px`)
      })
      observer.observe(element)
      return () => {
        observer.disconnect()
        root.style.removeProperty(variable)
      }
    },
    [variable],
  )

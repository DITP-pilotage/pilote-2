import { type RefObject, useEffect } from 'react'

// Publie la hauteur d'un élément dans une variable CSS de la page, mise à jour à
// chaque redimensionnement (un en-tête qui passe sur deux lignes, par exemple).
export const useHeightCssVariable = ({
  ref,
  variable,
}: {
  ref: RefObject<HTMLElement | null>
  variable: `--${string}`
}): void => {
  useEffect(() => {
    const element = ref.current
    if (!element) return
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
  }, [ref, variable])
}

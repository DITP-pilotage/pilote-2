import { useEffect, useState } from 'react'

// Un ref par callback : le conteneur du graphe est démonté par la vue tableau, l'observateur
// doit suivre chaque nouveau nœud.
export const useElementWidth = () => {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return { ref: setElement, width }
}

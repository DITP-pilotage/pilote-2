import { useEffect, useRef, useState, type PointerEvent } from 'react'

/**
 * Une taille bornée, modifiée au pointeur ou au clavier. Elle est re-bornée quand la fenêtre
 * change, et retenue en fin de geste (ou à chaque pas au clavier).
 */
export const useResizable = <Size, Handle extends string>({
  read,
  bound,
  persist,
}: {
  read: () => Size
  bound: (size: Size) => Size
  persist: (size: Size) => void
}) => {
  const [size, setSize] = useState(() => bound(read()))
  const latestSize = useRef(size)
  const [draggedHandle, setDraggedHandle] = useState<Handle | null>(null)

  const resize = (next: Size) => {
    latestSize.current = bound(next)
    setSize(latestSize.current)
  }

  useEffect(() => {
    const rebound = () => {
      latestSize.current = bound(latestSize.current)
      setSize(latestSize.current)
    }
    window.addEventListener('resize', rebound)
    return () => window.removeEventListener('resize', rebound)
  }, [bound])

  const startDrag = (handle: Handle) => (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggedHandle(handle)
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggedHandle) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDraggedHandle(null)
    persist(latestSize.current)
  }

  const resizeAndPersist = (next: Size) => {
    resize(next)
    persist(latestSize.current)
  }

  return { size, latestSize, draggedHandle, resize, resizeAndPersist, startDrag, endDrag }
}

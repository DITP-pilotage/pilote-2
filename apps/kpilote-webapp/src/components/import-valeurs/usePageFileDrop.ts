import { useEffect, useRef, useState } from 'react'

const contientFichier = (event: DragEvent): boolean =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files')

export function usePageFileDrop({
  enabled,
  onFile,
}: {
  enabled: boolean
  onFile: (file: File) => void
}): { isDragging: boolean } {
  const [isDragging, setIsDragging] = useState(false)
  const compteur = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const onDragEnter = (event: DragEvent) => {
      if (!contientFichier(event)) return
      compteur.current += 1
      setIsDragging(true)
    }
    const onDragOver = (event: DragEvent) => {
      if (contientFichier(event)) event.preventDefault()
    }
    const onDragLeave = () => {
      compteur.current = Math.max(0, compteur.current - 1)
      if (compteur.current === 0) setIsDragging(false)
    }
    const onDrop = (event: DragEvent) => {
      if (!contientFichier(event)) return
      event.preventDefault()
      compteur.current = 0
      setIsDragging(false)
      const file = event.dataTransfer?.files?.[0]
      if (file) onFile(file)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [enabled, onFile])

  return { isDragging }
}

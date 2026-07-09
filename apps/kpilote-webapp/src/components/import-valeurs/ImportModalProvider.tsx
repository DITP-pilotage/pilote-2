import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ImportModalContext, type ImportTarget } from './useImportModal'
import { ImportValeursModal } from './ImportValeursModal'

export function ImportModalProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ImportTarget | null>(null)

  const open = useCallback((next: ImportTarget) => setTarget(next), [])
  const close = useCallback(() => setTarget(null), [])

  const value = useMemo(() => ({ target, open, close }), [target, open, close])

  return (
    <ImportModalContext.Provider value={value}>
      {children}
      {target ? <ImportValeursModal target={target} onClose={close} /> : null}
    </ImportModalContext.Provider>
  )
}

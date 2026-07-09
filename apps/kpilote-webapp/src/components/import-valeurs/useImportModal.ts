import { createContext, useContext } from 'react'

export type ImportTarget = { indicateurId: string; indicateurNom: string; initialFile?: File }

export type ImportModalContextValue = {
  target: ImportTarget | null
  open: (target: ImportTarget) => void
  close: () => void
}

export const ImportModalContext = createContext<ImportModalContextValue | null>(null)

export function useImportModal(): ImportModalContextValue {
  const value = useContext(ImportModalContext)
  if (!value) throw new Error('useImportModal doit être utilisé dans ImportModalProvider')
  return value
}

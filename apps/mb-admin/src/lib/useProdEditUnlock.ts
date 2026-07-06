import { useState } from 'react'

import { session } from '@/session'

export const PROD_EDIT_UNLOCK_STORAGE_KEY = 'mbadmin_prod_edit_unlocked'

// Déverrouillage de l'édition en prod, persistant pour la session navigateur.
// Hors prod : toujours déverrouillé.
export function useProdEditUnlock(): { isProd: boolean; locked: boolean; unlock: () => void } {
  const isProd = session.current?.environment === 'prod'
  const [unlocked, setUnlocked] = useState<boolean>(
    () =>
      !isProd ||
      (typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem(PROD_EDIT_UNLOCK_STORAGE_KEY) === '1'),
  )

  const unlock = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(PROD_EDIT_UNLOCK_STORAGE_KEY, '1')
    }
    setUnlocked(true)
  }

  return { isProd, locked: isProd && !unlocked, unlock }
}

import { z } from 'zod'

// La conversation masquée survit au rechargement de l'onglet, pas à sa fermeture.
const KEY = 'kpilote-assistant:conversation'

const schema = z.object({ id: z.uuid() })

export const readMinimized = (): { id: string } | null => {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw === null) return null
    const result = schema.safeParse(JSON.parse(raw))
    if (result.success) return result.data
    sessionStorage.removeItem(KEY)
    return null
  } catch {
    return null
  }
}

export const writeMinimized = (id: string): void => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ id }))
  } catch {
    // Stockage indisponible : la conversation sera perdue au rechargement.
  }
}

export const clearMinimized = (): void => {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Rien à effacer.
  }
}

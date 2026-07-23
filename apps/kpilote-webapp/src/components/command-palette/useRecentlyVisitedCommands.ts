import { useNavigate } from '@tanstack/react-router'
import { BarChart3, FileText, FolderOpen } from 'lucide-react'
import { useMemo } from 'react'

import type { Command } from '@/lib/commands/types'
import { getRecentlyVisited } from '@/lib/recentlyVisited'
import { useImportModal } from '@/components/import-valeurs/useImportModal'

import { buildIndicateurActions } from './indicateurActions'
import { buildCollectionActions } from './collectionActions'
import { useCanImport } from './useCanImport'

const ICON_BY_TYPE = {
  indicateur: BarChart3,
  collection: FolderOpen,
  article: FileText,
} as const

/**
 * Commandes reconstruites depuis les 5 dernières fiches visitées (localStorage).
 * La liste est relue à chaque ouverture de la palette pour refléter les visites
 * les plus récentes sans instrumenter chaque navigation.
 *
 * Les permissions sont prefetchées dans le loader `_authenticated` :
 * `useCanImport` lit le cache via `useSuspenseQuery` sans suspendre en pratique.
 */
export function useRecentlyVisitedCommands(open: boolean, close: () => void): Command[] {
  const navigate = useNavigate()
  const canImport = useCanImport()
  const { open: openImport } = useImportModal()

  // Relu à chaque (ré)ouverture de la palette : `open` en dépendance suffit à
  // rafraîchir la liste sans effet ni setState.
  const entries = useMemo(() => (open ? getRecentlyVisited() : []), [open])

  return useMemo<Command[]>(
    () =>
      entries.map((entry) => {
        const cible = { id: entry.id, nom: entry.label }
        // Les articles du centre d'aide n'ont pas de sous-actions : ils naviguent
        // directement vers le lecteur. Indicateurs et collections gardent leurs actions.
        if (entry.type === 'article') {
          return {
            id: `recent:article:${entry.id}`,
            label: entry.label,
            group: 'recents',
            icon: ICON_BY_TYPE.article,
            run: () => {
              void navigate({ to: '/centre-aide', search: { article: entry.id } })
              close()
            },
          }
        }
        const actions =
          entry.type === 'indicateur'
            ? buildIndicateurActions(cible, { navigate, close, openImport, canImport })
            : buildCollectionActions(cible, { navigate, close })
        return {
          id: `recent:${entry.type}:${entry.id}`,
          label: entry.label,
          group: 'recents',
          keywords: [entry.id],
          hint: entry.id,
          icon: ICON_BY_TYPE[entry.type],
          run: () => {
            if (entry.type === 'indicateur') {
              void navigate({ to: '/indicateurs/$id', params: { id: entry.id } })
            } else {
              void navigate({ to: '/collections/$id', params: { id: entry.id } })
            }
            close()
          },
          actions,
        }
      }),
    [entries, navigate, close, openImport, canImport],
  )
}

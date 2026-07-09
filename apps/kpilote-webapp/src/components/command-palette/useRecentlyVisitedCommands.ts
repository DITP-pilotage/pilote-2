import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, ShoppingBasket } from 'lucide-react'
import { useMemo } from 'react'

import type { Command } from '@/lib/commands/types'
import { getRecentlyVisited } from '@/lib/recentlyVisited'
import { canWriteIndicateur, mePermissionsQueryOptions } from '@/queries/mePermissions'
import { useImportModal } from '@/components/import-valeurs/useImportModal'

import { buildIndicateurActions } from './indicateurActions'
import { buildPanierActions } from './panierActions'

const ICON_BY_TYPE = {
  indicateur: BarChart3,
  panier: ShoppingBasket,
} as const

/**
 * Commandes reconstruites depuis les 5 dernières fiches visitées (localStorage).
 * La liste est relue à chaque ouverture de la palette pour refléter les visites
 * les plus récentes sans instrumenter chaque navigation.
 */
export function useRecentlyVisitedCommands(open: boolean, close: () => void): Command[] {
  const navigate = useNavigate()
  const { data: permissions } = useQuery({ ...mePermissionsQueryOptions(), enabled: open })
  const { open: openImport } = useImportModal()

  const canImport = useMemo(
    () =>
      (indicateurId: string) =>
        permissions ? canWriteIndicateur({ permissions, indicateurId }) : false,
    [permissions],
  )

  // Relu à chaque (ré)ouverture de la palette : `open` en dépendance suffit à
  // rafraîchir la liste sans effet ni setState.
  const entries = useMemo(() => (open ? getRecentlyVisited() : []), [open])

  return useMemo<Command[]>(
    () =>
      entries.map((entry) => {
        const cible = { id: entry.id, nom: entry.label }
        const actions =
          entry.type === 'indicateur'
            ? buildIndicateurActions(cible, { navigate, close, openImport, canImport })
            : buildPanierActions(cible, { navigate, close })
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
              void navigate({ to: '/paniers/$id', params: { id: entry.id } })
            }
            close()
          },
          actions,
        }
      }),
    [entries, navigate, close, openImport, canImport],
  )
}

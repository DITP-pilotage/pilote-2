import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useMemo } from 'react'

import type { Command } from '@/lib/commands/types'
import { indicateursQueryOptions } from '@/queries/indicateurs'

import { buildIndicateurActions } from './indicateurActions'
import { useDebouncedValue } from './useDebouncedValue'

const DEBOUNCE_MS = 200
const MAX_RESULTS = 8

/**
 * Commandes issues de la recherche serveur d'indicateurs (param `recherche`).
 * Chaque résultat navigue vers la fiche `/indicateurs/$id` puis ferme la palette.
 */
export function useIndicateurCommands(
  query: string,
  close: () => void,
): { commands: Command[]; isLoading: boolean } {
  const navigate = useNavigate()
  const recherche = useDebouncedValue(query.trim(), DEBOUNCE_MS)
  const enabled = recherche.length > 0

  const { data, isFetching } = useQuery({
    ...indicateursQueryOptions({ recherche, pageSize: MAX_RESULTS }),
    enabled,
  })

  const commands = useMemo<Command[]>(() => {
    if (!enabled || !data) return []
    return data.items.map((indicateur) => ({
      id: `indicateur:${indicateur.id}`,
      label: indicateur.nom,
      group: 'indicateurs',
      keywords: [indicateur.id],
      hint: indicateur.id,
      icon: BarChart3,
      run: () => {
        void navigate({ to: '/indicateurs/$id', params: { id: indicateur.id } })
        close()
      },
      actions: buildIndicateurActions(indicateur, { navigate, close }),
    }))
  }, [enabled, data, navigate, close])

  return { commands, isLoading: enabled && isFetching }
}

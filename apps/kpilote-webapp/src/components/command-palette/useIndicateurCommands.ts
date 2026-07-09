import { useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useMemo } from 'react'

import { filterCommands, type Command } from '@/lib/commands/types'
import { allIndicateursQueryOptions } from '@/queries/indicateurs'
import { useImportModal } from '@/components/import-valeurs/useImportModal'

import { buildIndicateurActions } from './indicateurActions'
import { useCanImport } from './useCanImport'

const MAX_RESULTS = 8

/**
 * Commandes de recherche d'indicateurs. Toutes les fiches sont chargées à
 * l'ouverture de la palette (`open`) et filtrées côté client (insensible casse +
 * accents) sur le nom et le publicId. Chaque résultat navigue vers la fiche
 * `/indicateurs/$id` puis ferme la palette.
 *
 * Les données (indicateurs + permissions) sont prefetchées dans le loader
 * `_authenticated` : `useSuspenseQuery` lit le cache sans suspendre en pratique.
 */
export function useIndicateurCommands(query: string, _open: boolean, close: () => void): Command[] {
  const navigate = useNavigate()
  const { data } = useSuspenseQuery(allIndicateursQueryOptions())
  const canImport = useCanImport()
  const { open: openImport } = useImportModal()

  const allCommands = useMemo<Command[]>(
    () =>
      data.map((indicateur) => ({
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
        actions: buildIndicateurActions(indicateur, { navigate, close, openImport, canImport }),
      })),
    [data, navigate, close, openImport, canImport],
  )

  // On ne surface les résultats que lorsqu'une recherche est saisie : à vide, la
  // palette affiche navigation + fiches récentes, pas tout le catalogue.
  return useMemo<Command[]>(() => {
    if (query.trim().length === 0) return []
    return filterCommands(allCommands, query).slice(0, MAX_RESULTS)
  }, [allCommands, query])
}

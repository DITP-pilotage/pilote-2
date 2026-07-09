import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useMemo } from 'react'

import { filterCommands, type Command } from '@/lib/commands/types'
import { allIndicateursQueryOptions } from '@/queries/indicateurs'
import { canWriteIndicateur, mePermissionsQueryOptions } from '@/queries/mePermissions'
import { useImportModal } from '@/components/import-valeurs/useImportModal'

import { buildIndicateurActions } from './indicateurActions'

const MAX_RESULTS = 8

/**
 * Commandes de recherche d'indicateurs. Toutes les fiches sont chargées à
 * l'ouverture de la palette (`open`) et filtrées côté client (insensible casse +
 * accents) sur le nom et le publicId. Chaque résultat navigue vers la fiche
 * `/indicateurs/$id` puis ferme la palette.
 */
export function useIndicateurCommands(
  query: string,
  open: boolean,
  close: () => void,
): { commands: Command[]; isLoading: boolean } {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ ...allIndicateursQueryOptions(), enabled: open })
  const { data: permissions } = useQuery({ ...mePermissionsQueryOptions(), enabled: open })
  const { open: openImport } = useImportModal()

  const canImport = useMemo(
    () => (indicateurId: string) =>
      permissions ? canWriteIndicateur({ permissions, indicateurId }) : false,
    [permissions],
  )

  const allCommands = useMemo<Command[]>(() => {
    if (!data) return []
    return data.map((indicateur) => ({
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
    }))
  }, [data, navigate, close, openImport, canImport])

  // On ne surface les résultats que lorsqu'une recherche est saisie : à vide, la
  // palette affiche navigation + fiches récentes, pas tout le catalogue.
  const commands = useMemo<Command[]>(() => {
    if (query.trim().length === 0) return []
    return filterCommands(allCommands, query).slice(0, MAX_RESULTS)
  }, [allCommands, query])

  return { commands, isLoading: open && isLoading }
}

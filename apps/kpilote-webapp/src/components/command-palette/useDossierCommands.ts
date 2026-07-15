import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen } from 'lucide-react'
import { useMemo } from 'react'

import { filterCommands, type Command } from '@/lib/commands/types'
import { allDossiersQueryOptions } from '@/queries/dossiers'

import { buildDossierActions } from './dossierActions'

const MAX_RESULTS = 8

/**
 * Commandes de recherche de dossiers. Tous les dossiers sont chargés à l'ouverture
 * de la palette (`open`) et filtrés côté client (insensible casse + accents) sur
 * le nom et le publicId. Chaque résultat navigue vers la fiche `/dossiers/$id`
 * puis ferme la palette.
 */
export function useDossierCommands(
  query: string,
  open: boolean,
  close: () => void,
): { commands: Command[]; isLoading: boolean } {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ ...allDossiersQueryOptions(), enabled: open })

  const allCommands = useMemo<Command[]>(() => {
    if (!data) return []
    return data.map((dossier) => ({
      id: `dossier:${dossier.id}`,
      label: dossier.nom,
      group: 'dossiers',
      keywords: [dossier.id],
      hint: dossier.id,
      icon: FolderOpen,
      run: () => {
        void navigate({ to: '/dossiers/$id', params: { id: dossier.id } })
        close()
      },
      actions: buildDossierActions(dossier, { navigate, close }),
    }))
  }, [data, navigate, close])

  // On ne surface les résultats que lorsqu'une recherche est saisie : à vide, la
  // palette affiche navigation + fiches récentes, pas tout le catalogue.
  const commands = useMemo<Command[]>(() => {
    if (query.trim().length === 0) return []
    return filterCommands(allCommands, query).slice(0, MAX_RESULTS)
  }, [allCommands, query])

  return { commands, isLoading: open && isLoading }
}

import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen } from 'lucide-react'
import { useMemo } from 'react'

import { filterCommands, type Command } from '@/lib/commands/types'
import { allCollectionsQueryOptions } from '@/queries/collections'

import { buildCollectionActions } from './collectionActions'

const MAX_RESULTS = 8

/**
 * Commandes de recherche de collections. Toutes les collections sont chargées à l'ouverture
 * de la palette (`open`) et filtrés côté client (insensible casse + accents) sur
 * le nom et le publicId. Chaque résultat navigue vers la fiche `/collections/$id`
 * puis ferme la palette.
 */
export function useCollectionCommands(
  query: string,
  open: boolean,
  close: () => void,
): { commands: Command[]; isLoading: boolean } {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ ...allCollectionsQueryOptions(), enabled: open })

  const allCommands = useMemo<Command[]>(() => {
    if (!data) return []
    return data.map((collection) => ({
      id: `collection:${collection.id}`,
      label: collection.nom,
      group: 'collections',
      keywords: [collection.id],
      hint: collection.id,
      icon: FolderOpen,
      run: () => {
        void navigate({ to: '/collections/$id', params: { id: collection.id } })
        close()
      },
      actions: buildCollectionActions(collection, { navigate, close }),
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

import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBasket } from 'lucide-react'
import { useMemo } from 'react'

import { filterCommands, type Command } from '@/lib/commands/types'
import { allPaniersQueryOptions } from '@/queries/paniers'

import { buildPanierActions } from './panierActions'

const MAX_RESULTS = 8

/**
 * Commandes de recherche de paniers. Tous les paniers sont chargés à l'ouverture
 * de la palette (`open`) et filtrés côté client (insensible casse + accents) sur
 * le nom et le publicId. Chaque résultat navigue vers la fiche `/paniers/$id`
 * puis ferme la palette.
 */
export function usePanierCommands(
  query: string,
  open: boolean,
  close: () => void,
): { commands: Command[]; isLoading: boolean } {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ ...allPaniersQueryOptions(), enabled: open })

  const allCommands = useMemo<Command[]>(() => {
    if (!data) return []
    return data.map((panier) => ({
      id: `panier:${panier.id}`,
      label: panier.nom,
      group: 'paniers',
      keywords: [panier.id],
      hint: panier.id,
      icon: ShoppingBasket,
      run: () => {
        void navigate({ to: '/paniers/$id', params: { id: panier.id } })
        close()
      },
      actions: buildPanierActions(panier, { navigate, close }),
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

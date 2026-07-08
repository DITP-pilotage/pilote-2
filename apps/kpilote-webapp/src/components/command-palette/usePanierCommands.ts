import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBasket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { Command } from '@/lib/commands/types'
import { paniersQueryOptions } from '@/queries/paniers'

import { buildPanierActions } from './panierActions'

const DEBOUNCE_MS = 200
const MAX_RESULTS = 8

/** Débounce une valeur : ne renvoie la nouvelle qu'après `delay` ms sans changement. */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Commandes issues de la recherche serveur de paniers (param `recherche`).
 * Chaque résultat navigue vers la fiche `/paniers/$id` puis ferme la palette.
 */
export function usePanierCommands(
  query: string,
  close: () => void,
): { commands: Command[]; isLoading: boolean } {
  const navigate = useNavigate()
  const recherche = useDebouncedValue(query.trim(), DEBOUNCE_MS)
  const enabled = recherche.length > 0

  const { data, isFetching } = useQuery({
    ...paniersQueryOptions({ recherche, pageSize: MAX_RESULTS }),
    enabled,
  })

  const commands = useMemo<Command[]>(() => {
    if (!enabled || !data) return []
    return data.items.map((panier) => ({
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
  }, [enabled, data, navigate, close])

  return { commands, isLoading: enabled && isFetching }
}

import type { useNavigate } from '@tanstack/react-router'
import { FileText, Landmark, MessageSquare } from 'lucide-react'

import type { CommandAction } from '@/lib/commands/types'

type BuildActionsContext = {
  navigate: ReturnType<typeof useNavigate>
  close: () => void
}

/**
 * Sous-actions (`Tab`) proposées sur un panier : pure navigation vers un onglet
 * de la fiche `/paniers/$id`, aucun appel API supplémentaire.
 *
 * Point d'extension du domaine panier : les actions futures s'ajoutent ici avec
 * leur propre `run()`.
 */
export function buildPanierActions(
  panier: { id: string; nom: string },
  { navigate, close }: BuildActionsContext,
): CommandAction[] {
  const goToOnglet = (onglet: 'resultats' | 'commentaires' | 'gouvernance') => () => {
    // On conserve le couple individu/referentiel (contexte transverse aux fiches)
    // et on ne fixe que `onglet`. `commentaires` reprend son défaut côté route.
    // On ne peut pas étaler tout `prev` : il agrège le search cross-domaine (ex.
    // `commentaires` indicateur) invalide pour le schéma panier.
    void navigate({
      to: '/paniers/$id',
      params: { id: panier.id },
      search: (prev) => ({ individu: prev.individu, referentiel: prev.referentiel, onglet }),
    })
    close()
  }

  return [
    {
      id: `panier:${panier.id}:fiche`,
      label: 'Voir la fiche',
      icon: FileText,
      keywords: ['résultats', 'ouvrir'],
      run: goToOnglet('resultats'),
    },
    {
      id: `panier:${panier.id}:commentaires`,
      label: 'Voir les commentaires',
      icon: MessageSquare,
      run: goToOnglet('commentaires'),
    },
    {
      id: `panier:${panier.id}:gouvernance`,
      label: 'Voir la gouvernance',
      icon: Landmark,
      run: goToOnglet('gouvernance'),
    },
  ]
}

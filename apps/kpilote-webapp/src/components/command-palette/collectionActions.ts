import type { useNavigate } from '@tanstack/react-router'
import { FileText, Landmark, MessageSquare, ShieldCheck } from 'lucide-react'

import type { CommandAction } from '@/lib/commands/types'

type BuildActionsContext = {
  navigate: ReturnType<typeof useNavigate>
  close: () => void
}

/**
 * Sous-actions (`Tab`) proposées sur un collection : pure navigation vers un onglet
 * de la fiche `/collections/$id`, aucun appel API supplémentaire.
 *
 * Point d'extension du domaine collection : les actions futures s'ajoutent ici avec
 * leur propre `run()`.
 */
export function buildCollectionActions(
  collection: { id: string; nom: string },
  { navigate, close }: BuildActionsContext,
): CommandAction[] {
  const goToOnglet = (onglet: 'resultats' | 'gouvernance' | 'confiance' | 'commentaires') => () => {
    // On conserve le couple individu/referentiel (contexte transverse aux fiches)
    // et on ne fixe que `onglet`. On ne peut pas étaler tout `prev` : il agrège
    // le search cross-domaine invalide pour le schéma collection.
    void navigate({
      to: '/collections/$id',
      params: { id: collection.id },
      search: (prev) => ({ individu: prev.individu, referentiel: prev.referentiel, onglet }),
    })
    close()
  }

  return [
    {
      id: `collection:${collection.id}:fiche`,
      label: 'Voir la fiche',
      icon: FileText,
      keywords: ['résultats', 'ouvrir'],
      run: goToOnglet('resultats'),
    },
    {
      id: `collection:${collection.id}:gouvernance`,
      label: 'Voir la gouvernance',
      icon: Landmark,
      run: goToOnglet('gouvernance'),
    },
    {
      id: `collection:${collection.id}:confiance`,
      label: 'Voir le niveau de confiance',
      icon: ShieldCheck,
      run: goToOnglet('confiance'),
    },
    {
      id: `collection:${collection.id}:commentaires`,
      label: 'Voir les commentaires',
      icon: MessageSquare,
      run: goToOnglet('commentaires'),
    },
  ]
}

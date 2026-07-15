import type { useNavigate } from '@tanstack/react-router'
import { FileText, Landmark, MessageSquare, ShieldCheck } from 'lucide-react'

import type { CommandAction } from '@/lib/commands/types'

type BuildActionsContext = {
  navigate: ReturnType<typeof useNavigate>
  close: () => void
}

/**
 * Sous-actions (`Tab`) proposées sur un dossier : pure navigation vers un onglet
 * de la fiche `/dossiers/$id`, aucun appel API supplémentaire.
 *
 * Point d'extension du domaine dossier : les actions futures s'ajoutent ici avec
 * leur propre `run()`.
 */
export function buildDossierActions(
  dossier: { id: string; nom: string },
  { navigate, close }: BuildActionsContext,
): CommandAction[] {
  const goToOnglet = (onglet: 'resultats' | 'gouvernance' | 'confiance' | 'commentaires') => () => {
    // On conserve le couple individu/referentiel (contexte transverse aux fiches)
    // et on ne fixe que `onglet`. On ne peut pas étaler tout `prev` : il agrège
    // le search cross-domaine invalide pour le schéma dossier.
    void navigate({
      to: '/dossiers/$id',
      params: { id: dossier.id },
      search: (prev) => ({ individu: prev.individu, referentiel: prev.referentiel, onglet }),
    })
    close()
  }

  return [
    {
      id: `dossier:${dossier.id}:fiche`,
      label: 'Voir la fiche',
      icon: FileText,
      keywords: ['résultats', 'ouvrir'],
      run: goToOnglet('resultats'),
    },
    {
      id: `dossier:${dossier.id}:gouvernance`,
      label: 'Voir la gouvernance',
      icon: Landmark,
      run: goToOnglet('gouvernance'),
    },
    {
      id: `dossier:${dossier.id}:confiance`,
      label: 'Voir le niveau de confiance',
      icon: ShieldCheck,
      run: goToOnglet('confiance'),
    },
    {
      id: `dossier:${dossier.id}:commentaires`,
      label: 'Voir les commentaires',
      icon: MessageSquare,
      run: goToOnglet('commentaires'),
    },
  ]
}

import type { useNavigate } from '@tanstack/react-router'
import { FileText, Info, MessageSquare } from 'lucide-react'

import type { CommandAction } from '@/lib/commands/types'

type BuildActionsContext = {
  navigate: ReturnType<typeof useNavigate>
  close: () => void
}

/**
 * Sous-actions (`Tab`) proposées sur un indicateur : pure navigation vers un
 * onglet de la fiche `/indicateurs/$id`, aucun appel API supplémentaire.
 *
 * Point d'extension du domaine indicateur : les actions futures (ex. « Importer
 * des données ») s'ajoutent ici avec leur propre `run()`.
 */
export function buildIndicateurActions(
  indicateur: { id: string; nom: string },
  { navigate, close }: BuildActionsContext,
): CommandAction[] {
  const goToOnglet = (onglet: 'valeurs' | 'commentaires' | 'metadonnees') => () => {
    // On conserve le couple individu/referentiel (contexte transverse aux fiches)
    // et on ne fixe que `onglet`. `commentaires` reprend son défaut côté route.
    // On ne peut pas étaler tout `prev` : il agrège le search cross-domaine (ex.
    // `commentaires` panier) invalide pour le schéma indicateur.
    void navigate({
      to: '/indicateurs/$id',
      params: { id: indicateur.id },
      search: (prev) => ({ individu: prev.individu, referentiel: prev.referentiel, onglet }),
    })
    close()
  }

  return [
    {
      id: `indicateur:${indicateur.id}:fiche`,
      label: 'Voir la fiche',
      icon: FileText,
      keywords: ['valeurs', 'ouvrir'],
      run: goToOnglet('valeurs'),
    },
    {
      id: `indicateur:${indicateur.id}:commentaires`,
      label: 'Voir les commentaires',
      icon: MessageSquare,
      run: goToOnglet('commentaires'),
    },
    {
      id: `indicateur:${indicateur.id}:metadonnees`,
      label: 'Voir les métadonnées',
      icon: Info,
      run: goToOnglet('metadonnees'),
    },
  ]
}

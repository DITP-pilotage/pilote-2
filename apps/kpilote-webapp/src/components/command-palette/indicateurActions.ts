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
  const goTo =
    (onglet: 'resultats' | 'metadonnees', sousOnglet?: 'confiance' | 'evolution' | 'commentaire') =>
    () => {
      void navigate({
        to: '/indicateurs/$id',
        params: { id: indicateur.id },
        search: (prev) => ({
          individu: prev.individu,
          referentiel: prev.referentiel,
          onglet,
          ...(sousOnglet ? { sousOnglet } : {}),
        }),
      })
      close()
    }

  return [
    {
      id: `indicateur:${indicateur.id}:fiche`,
      label: 'Voir la fiche',
      icon: FileText,
      keywords: ['résultats', 'ouvrir'],
      run: goTo('resultats'),
    },
    {
      id: `indicateur:${indicateur.id}:commentaires`,
      label: 'Voir les commentaires',
      icon: MessageSquare,
      run: goTo('resultats', 'commentaire'),
    },
    {
      id: `indicateur:${indicateur.id}:metadonnees`,
      label: 'Voir les métadonnées',
      icon: Info,
      run: goTo('metadonnees'),
    },
  ]
}

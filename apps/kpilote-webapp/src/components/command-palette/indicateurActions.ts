import type { useNavigate } from '@tanstack/react-router'
import { BarChart2, FileText, Info, MessageSquare, ShieldCheck } from 'lucide-react'

import type { CommandAction } from '@/lib/commands/types'

type BuildActionsContext = {
  navigate: ReturnType<typeof useNavigate>
  close: () => void
}

/**
 * Actions de navigation proposées sur un indicateur dans la command palette.
 * Couvrent les deux onglets primaires (Résultats, Métadonnées) et les trois
 * sous-onglets de Résultats (Niveau de confiance, Evolution et répartition, Commentaire).
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
      id: `indicateur:${indicateur.id}:confiance`,
      label: 'Voir le niveau de confiance',
      icon: ShieldCheck,
      run: goTo('resultats', 'confiance'),
    },
    {
      id: `indicateur:${indicateur.id}:evolution`,
      label: "Voir l'évolution et répartition",
      icon: BarChart2,
      run: goTo('resultats', 'evolution'),
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

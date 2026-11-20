import type { useNavigate } from '@tanstack/react-router'
import { BarChart2, FileText, Info, MessageSquare, ShieldCheck, Table2, Upload } from 'lucide-react'

import type { ImportTarget } from '@/components/import-valeurs/useImportModal'
import type { CommandAction } from '@/lib/commands/types'

type BuildActionsContext = {
  navigate: ReturnType<typeof useNavigate>
  close: () => void
  openImport?: (target: ImportTarget) => void
  canImport?: (indicateurId: string) => boolean
  // Feature TABLEAU_VALEURS : l'onglet Tableau des valeurs de la fiche.
  hasTableauValeurs?: boolean
}

/**
 * Actions de navigation proposées sur un indicateur dans la command palette.
 * Couvrent les onglets primaires (Résultats, Métadonnées, Tableau des valeurs) et les trois
 * sous-onglets de Résultats (Niveau de confiance, Evolution et répartition, Commentaire).
 */
export function buildIndicateurActions(
  indicateur: { id: string; nom: string },
  { navigate, close, openImport, canImport, hasTableauValeurs = false }: BuildActionsContext,
): CommandAction[] {
  const goTo =
    (
      onglet: 'resultats' | 'valeurs' | 'metadonnees',
      sousOnglet?: 'confiance' | 'evolution' | 'commentaire',
    ) =>
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

  const actions: CommandAction[] = [
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

  if (hasTableauValeurs) {
    actions.push({
      id: `indicateur:${indicateur.id}:valeurs`,
      label: 'Voir le tableau des valeurs',
      icon: Table2,
      keywords: ['répartition', 'axes', 'modalités', 'tableau croisé', 'lignes'],
      run: goTo('valeurs'),
    })
  }

  if (openImport && canImport?.(indicateur.id)) {
    actions.push({
      id: `indicateur:${indicateur.id}:import`,
      label: 'Importer des valeurs',
      icon: Upload,
      keywords: ['import', 'csv', 'excel', 'charger'],
      run: () => {
        openImport({
          indicateur: { id: indicateur.id, nom: indicateur.nom },
          onSuccess: () => {
            void navigate({
              to: '/indicateurs/$id',
              params: { id: indicateur.id },
              search: (prev) => ({
                individu: prev.individu,
                referentiel: prev.referentiel,
                onglet: 'resultats',
              }),
            })
          },
        })
        close()
      },
    })
  }

  return actions
}

import { type Dashboard, type DashboardWidget } from '@pilote/kpilote-shared/assistant/dashboard'

import { type DashboardContext } from '@/assistant/tools/dashboard/context'
import { ValidationError } from '@/framework/errors/AppError'

// Un chiffre suivi d'une unité de mesure : les valeurs viennent des widgets, jamais du
// texte. Quantificateurs bornés, pour qu'un texte long ne fasse pas exploser la regex.
const NUMBER_PATTERN = /\d{1,10}(?:[,.]\d{1,10})?\s{0,5}(?:%|points?\b|pts\b)/iu

const referencesOf = (widget: DashboardWidget) => {
  switch (widget.type) {
    case 'kpi_indicateur':
      return { indicateurs: [widget.indicateurId], individus: [widget.individuId] }
    case 'evolution_indicateur':
    case 'tableau_individus':
      return { indicateurs: [widget.indicateurId], individus: widget.individuIds }
    case 'kpi_collection':
    case 'contributions_collection':
      return { collections: [widget.collectionId], individus: [widget.individuId] }
    case 'valeurs_remarquables':
    case 'carte_indicateur':
      return { indicateurs: [widget.indicateurId], referentiels: [widget.referentielId] }
    case 'titre_section':
    case 'paragraph':
      return {}
  }
}

const textsOf = (widget: DashboardWidget): string[] => {
  if (widget.type === 'titre_section') return [widget.titre, widget.description ?? '']
  if (widget.type === 'paragraph') return widget.contenu
  return []
}

/**
 * Lève une erreur que le modèle peut corriger quand un widget sort du contexte : identifiant
 * inventé, référentiel étranger à l'indicateur, carte impossible, chiffre écrit en texte.
 */
export const validateDashboard = (dashboard: Dashboard, context: DashboardContext): void => {
  const known = {
    indicateurs: new Set(context.indicateurs.map(({ id }) => id)),
    collections: new Set(context.collections.map(({ id }) => id)),
    individus: new Set(context.individus.map(({ id }) => id)),
    referentiels: new Set(context.referentiels.map(({ id }) => id)),
  }
  const problems: string[] = []

  for (const widget of dashboard.containers.flatMap((container) => container.widgets)) {
    const references = referencesOf(widget)
    for (const family of ['indicateurs', 'collections', 'individus', 'referentiels'] as const) {
      for (const id of references[family] ?? []) {
        if (!known[family].has(id)) problems.push(`${id} n'est pas dans le contexte`)
      }
    }

    if (widget.type === 'valeurs_remarquables' || widget.type === 'carte_indicateur') {
      const indicateur = context.indicateurs.find(({ id }) => id === widget.indicateurId)
      if (indicateur && !indicateur.referentielIds.includes(widget.referentielId)) {
        problems.push(`${widget.referentielId} n'est pas un référentiel de ${widget.indicateurId}`)
      }
      const referentiel = context.referentiels.find(({ id }) => id === widget.referentielId)
      if (widget.type === 'carte_indicateur' && referentiel && !referentiel.carte) {
        problems.push(`${widget.referentielId} n'a pas de carte`)
      }
    }

    if (textsOf(widget).some((text) => NUMBER_PATTERN.test(text))) {
      problems.push(`le texte d'un widget ${widget.type} contient un chiffre`)
    }
  }
  if (NUMBER_PATTERN.test(dashboard.titre)) problems.push('le titre contient un chiffre')

  if (problems.length > 0) {
    throw new ValidationError(
      `Dashboard refusé : ${problems.join(' ; ')}. N'utilise que les identifiants du contexte et aucun chiffre en texte.`,
    )
  }
}

import { type Dashboard, type DashboardWidget } from '@pilote/kpilote-shared/assistant/dashboard'

import { type DashboardContext } from '@/assistant/tools/dashboard/context'
import { ValidationError } from '@/framework/errors/AppError'

// Les valeurs viennent des widgets, jamais du texte : hors noms et identifiants du contexte,
// le seul nombre permis est une année.
const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/gu
const DIGIT_PATTERN = /\d/u

const writesANumber = (text: string, known: ReadonlyArray<string>): boolean => {
  const withoutKnown = known.reduce((rest, label) => rest.split(label).join(' '), text)
  return DIGIT_PATTERN.test(withoutKnown.replace(YEAR_PATTERN, ' '))
}

const repeated = (ids: ReadonlyArray<string>): string[] =>
  ids.filter((id, index) => ids.indexOf(id) !== index)

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
  // Les plus longs d'abord : un nom qui en contient un autre est retiré en entier.
  const labels = [
    ...context.indicateurs,
    ...context.collections,
    ...context.individus,
    ...context.referentiels,
  ]
    .flatMap(({ id, nom }) => [id, nom])
    .sort((a, b) => b.length - a.length)
  const problems: string[] = []

  for (const widget of dashboard.containers.flatMap((container) => container.widgets)) {
    const references = referencesOf(widget)
    for (const family of ['indicateurs', 'collections', 'individus', 'referentiels'] as const) {
      for (const id of references[family] ?? []) {
        if (!known[family].has(id)) problems.push(`${id} n'est pas dans le contexte`)
      }
    }

    for (const id of repeated(references.individus ?? [])) {
      problems.push(`${id} est répété dans un widget ${widget.type}`)
    }

    // Un individu hors des référentiels de l'indicateur n'a pas de valeur : le widget serait vide.
    const indicateurOf = context.indicateurs.find(({ id }) => id === references.indicateurs?.[0])
    if (indicateurOf) {
      for (const individuId of references.individus ?? []) {
        const individu = context.individus.find(({ id }) => id === individuId)
        if (individu && !indicateurOf.referentielIds.includes(individu.referentielId)) {
          problems.push(`${individuId} n'appartient à aucun référentiel de ${indicateurOf.id}`)
        }
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

    if (textsOf(widget).some((text) => writesANumber(text, labels))) {
      problems.push(`le texte d'un widget ${widget.type} contient un chiffre`)
    }
  }
  if (writesANumber(dashboard.titre, labels)) problems.push('le titre contient un chiffre')

  if (problems.length > 0) {
    throw new ValidationError(
      `Dashboard refusé : ${problems.join(' ; ')}. Corrige le dashboard : identifiants du contexte seulement, aucun chiffre en texte hors des noms et des années.`,
    )
  }
}

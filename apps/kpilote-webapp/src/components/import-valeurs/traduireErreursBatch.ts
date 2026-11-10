import type {
  BatchInvalidErrorDetailsApiModel,
  BatchInvalidErrorEntryApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import type { ValidationIssueApiModel } from '@pilote/kpilote-shared/error'

const numeroLigne = (index: number): number => index + 2

const libelleLignes = (indices: number[]): string => {
  const numeros = indices.map(numeroLigne)
  const mot = numeros.length > 1 ? 'lignes' : 'ligne'
  return `${mot} ${numeros.join(', ')}`
}

const traduireEntree = (entree: BatchInvalidErrorEntryApiModel): string => {
  switch (entree.code) {
    case 'INVALID_ITEM': {
      const champs = entree.issues.map((issue) => issue.path).join(', ')
      const [premierIndice = 0] = entree.indices
      return `Ligne ${numeroLigne(premierIndice)} : champ « ${champs} » invalide.`
    }
    case 'INDIVIDU_INCONNU':
      return `Individu inconnu « ${entree.individu} » (${libelleLignes(entree.indices)}).`
    case 'DUPLICATE_KEY':
      return `Doublon ${entree.individu} / ${entree.date} (${libelleLignes(entree.indices)}).`
    case 'COORDONNEE_MANQUANTE':
      return (
        `Membre manquant pour la dimension « ${entree.dimension} » (${libelleLignes(entree.indices)}) : ` +
        'une valeur se saisit avec un membre par dimension.'
      )
    case 'DIMENSION_NON_DECLAREE':
      return `« ${entree.individu} » relève d'une dimension que l'indicateur ne déclare pas (${libelleLignes(entree.indices)}).`
    case 'COORDONNEES_EN_DOUBLE':
      return `Plusieurs membres de la dimension « ${entree.dimension} » sur une même ligne (${libelleLignes(entree.indices)}).`
    case 'CELLULE_AGREGEE':
      return (
        `« ${entree.individu} » est un membre agrégé dont la valeur se calcule ` +
        `(${libelleLignes(entree.indices)}) : saisissez ses membres détaillés.`
      )
    case 'HORS_PERIMETRE':
      return `« ${entree.individu} » est hors de votre périmètre de saisie (${libelleLignes(entree.indices)}).`
    default: {
      const exhaustif: never = entree
      return exhaustif
    }
  }
}

export function traduireErreursBatch({
  details,
}: {
  details: BatchInvalidErrorDetailsApiModel
}): string[] {
  return details.errors.map(traduireEntree)
}

export function traduireIssuesValidation({
  issues,
}: {
  issues: ValidationIssueApiModel[]
}): string[] {
  return issues.map((issue) => {
    // Extraire l'index numérique du path (ex: ['items', 2, 'date'] -> 2)
    const numericIndex = issue.path.find(
      (segment): segment is number => typeof segment === 'number',
    )

    // Extraire le dernier segment string du path (le nom du champ)
    const fieldName = issue.path.findLast(
      (segment): segment is string => typeof segment === 'string',
    )

    if (numericIndex !== undefined && fieldName) {
      const ligne = numeroLigne(numericIndex)
      return `Ligne ${ligne} : champ « ${fieldName} » invalide — ${issue.message}`
    }

    return `Ligne inconnue : ${issue.message}`
  })
}

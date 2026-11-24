import type {
  BatchInvalidErrorDetailsApiModel,
  BatchInvalidErrorEntryApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import type { ValidationIssueApiModel } from '@pilote/kpilote-shared/error'
import { keyBy } from 'es-toolkit'
import type { AxeImport } from './normalisation/lecture/matriceVersRows'

const numeroLigne = (index: number): number => index + 2

const libelleLignes = (indices: number[]): string => {
  const numeros = indices.map(numeroLigne)
  const mot = numeros.length > 1 ? 'lignes' : 'ligne'
  return `${mot} ${numeros.join(', ')}`
}

// Un axe se nomme par son nom quand l'indicateur le déclare, sinon par son publicId.
const traduireEntree = (
  entree: BatchInvalidErrorEntryApiModel,
  axeName: (publicId: string) => string,
): string => {
  switch (entree.code) {
    case 'INVALID_ITEM': {
      const champs = entree.issues.map((issue) => issue.path).join(', ')
      const [premierIndice = 0] = entree.indices
      return `Ligne ${numeroLigne(premierIndice)} : champ « ${champs} » invalide.`
    }
    case 'INDIVIDU_INCONNU':
      return `Individu inconnu « ${entree.individu} » (${libelleLignes(entree.indices)}).`
    case 'DUPLICATE_KEY': {
      const cellule = [entree.individu, ...(entree.modalites ?? []), entree.date].join(' / ')
      return `Doublon ${cellule} (${libelleLignes(entree.indices)}).`
    }
    case 'MODALITE_INCONNUE':
      return `Modalité inconnue « ${entree.modalite} » (${libelleLignes(entree.indices)}).`
    case 'AXE_NON_DECLARE':
      return `Modalité « ${entree.modalite} » d’un axe que l’indicateur ne déclare pas (${libelleLignes(entree.indices)}).`
    case 'MODALITES_MEME_AXE':
      return `Plusieurs modalités de l’axe « ${axeName(entree.axe)} » (${libelleLignes(entree.indices)}).`
    case 'MODALITE_MANQUANTE':
      return `Modalité manquante pour l’axe « ${axeName(entree.axe)} » (${libelleLignes(entree.indices)}).`
    case 'MODALITE_NON_FEUILLE':
      return `Modalité « ${entree.modalite} » non saisissable : sa valeur se calcule à partir de ses sous-modalités (${libelleLignes(entree.indices)}).`
    default: {
      const exhaustif: never = entree
      return exhaustif
    }
  }
}

export function traduireErreursBatch({
  details,
  axes = [],
}: {
  details: BatchInvalidErrorDetailsApiModel
  axes?: ReadonlyArray<AxeImport>
}): string[] {
  const axeById = keyBy(axes, (axe) => axe.id)
  const axeName = (publicId: string): string => axeById[publicId]?.nom ?? publicId
  return details.errors.map((entree) => traduireEntree(entree, axeName))
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

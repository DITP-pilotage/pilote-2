import { pluralize } from '@pilote/kpilote-shared/texte'
import type {
  BatchInvalidErrorDetailsApiModel,
  BatchInvalidErrorEntryApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import type { ValidationIssueApiModel } from '@pilote/kpilote-shared/error'
import { keyBy } from 'es-toolkit'

// Un axe de l'indicateur : son identifiant public et son nom, pour le citer.
export type AxeImport = { id: string; nom: string }

// Numéro affiché pour l'item d'indice donné dans le lot envoyé.
type RowNumberOf = (index: number) => number

const libelleLignes = ({
  indices,
  rowNumberOf,
}: {
  indices: number[]
  rowNumberOf: RowNumberOf
}): string => {
  const numeros = indices.map(rowNumberOf)
  const mot = pluralize({ count: numeros.length, singular: 'ligne', plural: 'lignes' })
  return `${mot} ${numeros.join(', ')}`
}

// Un axe se nomme par son nom quand l'indicateur le déclare, sinon par son publicId.
const traduireEntree = (
  entree: BatchInvalidErrorEntryApiModel,
  { axeName, rowNumberOf }: { axeName: (publicId: string) => string; rowNumberOf: RowNumberOf },
): string => {
  const lignes = libelleLignes({ indices: entree.indices, rowNumberOf })
  switch (entree.code) {
    case 'INVALID_ITEM': {
      const champs = entree.issues.map((issue) => issue.path).join(', ')
      const [premierIndice = 0] = entree.indices
      return `Ligne ${rowNumberOf(premierIndice)} : champ « ${champs} » invalide.`
    }
    case 'INDIVIDU_INCONNU':
      return `Individu inconnu « ${entree.individu} » (${lignes}).`
    case 'DUPLICATE_KEY': {
      const cellule = [entree.individu, ...(entree.modalites ?? []), entree.date].join(' / ')
      return `Doublon ${cellule} (${lignes}).`
    }
    case 'MODALITE_INCONNUE':
      return `Modalité inconnue « ${entree.modalite} » (${lignes}).`
    case 'AXE_NON_DECLARE':
      return `Modalité « ${entree.modalite} » d’un axe que l’indicateur ne déclare pas (${lignes}).`
    case 'MODALITES_MEME_AXE':
      return `Plusieurs modalités de l’axe « ${axeName(entree.axe)} » (${lignes}).`
    case 'MODALITE_MANQUANTE':
      return `Modalité manquante pour l’axe « ${axeName(entree.axe)} » (${lignes}).`
    case 'MODALITE_NON_FEUILLE':
      return `Modalité « ${entree.modalite} » non saisissable : sa valeur se calcule à partir de ses sous-modalités (${lignes}).`
    default: {
      const exhaustif: never = entree
      return exhaustif
    }
  }
}

export function traduireErreursBatch({
  details,
  axes = [],
  rowNumbers,
}: {
  details: BatchInvalidErrorDetailsApiModel
  axes?: ReadonlyArray<AxeImport>
  // Numéro de ligne de la grille pour chaque item envoyé, dans l'ordre du lot.
  // Sans lui, l'item d'indice `i` est la ligne `i + 2` d'un fichier à en-têtes.
  rowNumbers?: ReadonlyArray<number>
}): string[] {
  const rowNumberOf: RowNumberOf = (index) => rowNumbers?.[index] ?? index + 2
  const axeById = keyBy(axes, (axe) => axe.id)
  const axeName = (publicId: string): string => axeById[publicId]?.nom ?? publicId
  return details.errors.map((entree) => traduireEntree(entree, { axeName, rowNumberOf }))
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
      const ligne = numericIndex + 2
      return `Ligne ${ligne} : champ « ${fieldName} » invalide : ${issue.message}`
    }

    return `Ligne inconnue : ${issue.message}`
  })
}

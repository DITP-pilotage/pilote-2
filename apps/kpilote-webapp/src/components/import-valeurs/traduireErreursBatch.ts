import type {
  BatchInvalidErrorDetailsApiModel,
  BatchInvalidErrorEntryApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'

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

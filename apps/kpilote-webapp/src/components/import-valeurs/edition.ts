import { type PlanTransformation } from '@pilote/kpilote-shared/valeurImport'
import {
  correctionKey,
  type CorrectionsCellules,
  type LigneImport,
} from '@pilote/kpilote-shared/valeurImport/applyPlan'
import {
  type CibleRapprochement,
  setRapprochement,
} from '@pilote/kpilote-shared/valeurImport/buildPlan'

import { type EditionCellule } from './grille'

// Ce que l'utilisateur a corrigé dans la grille : le plan (rapprochements) et
// des cellules de date ou de valeur. `key` rattache ces corrections au plan de
// départ dont elles viennent.
export type Edition = {
  key: string
  plan: PlanTransformation
  corrections: CorrectionsCellules
}

// L'édition en cours pour le plan de départ affiché. Des corrections faites sur
// un autre fichier (autre clé) sont ignorées : on repart du plan de départ.
export const selectEdition = ({
  edition,
  key,
  plan,
}: {
  edition: Edition | null
  key: string
  plan: PlanTransformation
}): Edition => {
  if (edition && edition.key === key) return edition
  return { key, plan, corrections: {} }
}

export const withRapprochement = ({
  edition,
  cible,
  libelle,
  publicId,
}: {
  edition: Edition
  cible: CibleRapprochement
  libelle: string
  publicId: string
}): Edition => ({
  ...edition,
  plan: setRapprochement({ plan: edition.plan, cible, libelle, publicId }),
})

export const withCorrection = ({
  edition,
  source,
  correction,
}: {
  edition: Edition
  source: LigneImport['source']
  correction: { date?: string; valeur?: number }
}): Edition => {
  const key = correctionKey(source)
  return {
    ...edition,
    corrections: {
      ...edition.corrections,
      [key]: { ...edition.corrections[key], ...correction },
    },
  }
}

// Ce que l'éditeur d'une cellule renvoie. Un rapprochement porte l'édition dont il vient : sa
// cible et son libellé disent quelle entrée du plan corriger.
export type CorrectionSaisie =
  | {
      type: 'RAPPROCHEMENT'
      edition: Extract<EditionCellule, { type: 'RAPPROCHEMENT' }>
      publicId: string
    }
  | { type: 'DATE'; date: string }
  | { type: 'VALEUR'; valeur: number }

// Un rapprochement corrige le plan : `applyPlan` le rejoue sur toutes les lignes du libellé. Une
// date ou une valeur ne corrige que la cellule de sa ligne.
export const applyCorrection = ({
  edition,
  ligne,
  correction,
}: {
  edition: Edition
  ligne: LigneImport
  correction: CorrectionSaisie
}): Edition => {
  switch (correction.type) {
    case 'RAPPROCHEMENT':
      return withRapprochement({
        edition,
        cible: correction.edition.cible,
        libelle: correction.edition.libelle,
        publicId: correction.publicId,
      })
    case 'DATE':
      return withCorrection({
        edition,
        source: ligne.source,
        correction: { date: correction.date },
      })
    case 'VALEUR':
      return withCorrection({
        edition,
        source: ligne.source,
        correction: { valeur: correction.valeur },
      })
  }
}

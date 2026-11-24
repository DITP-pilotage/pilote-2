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

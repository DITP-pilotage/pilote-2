import {
  type CiblesSaisieApiModel,
  type EtapePlan,
  type PlanTransformation,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'
import { buildPlanStandard } from '@pilote/kpilote-shared/valeurImport/buildPlan'

import { type PlanImportResult } from '@/queries/planImport'

import { buildEtapesAttente, type EtapeAttente } from './etapesAttente'
import { type LectureError, type LectureTableau } from './lecture/matriceVersTableau'

export type EtatImport =
  | { kind: 'vide' }
  | { kind: 'lecture' }
  | { kind: 'illisible'; error: LectureError }
  | { kind: 'attente'; tableau: TableauSource; etapes: EtapeAttente[] }
  | { kind: 'echec'; explication: string }
  | {
      kind: 'grille'
      tableau: TableauSource
      // Plan de départ, avant toute correction de l'utilisateur.
      plan: PlanTransformation
      origine: 'STANDARD' | 'ALBERT'
    }

const CIBLES_INDISPONIBLES =
  'Les individus et les axes de l’indicateur n’ont pas pu être chargés. Réessayez dans un instant.'

// Le tableau à confier à Albert : celui d'un fichier lisible qui n'est pas au
// format standard. `null` tant qu'on ne sait pas, ou quand Albert est inutile.
export const selectTableauForAlbert = ({
  lecture,
  cibles,
}: {
  lecture: LectureTableau | undefined
  cibles: CiblesSaisieApiModel | undefined
}): TableauSource | null => {
  if (!lecture?.ok || !cibles) return null
  const standard = buildPlanStandard({ tableau: lecture.tableau, cibles })
  return standard.ok ? null : lecture.tableau
}

// `undefined` = pas encore chargé. Un fichier au format standard donne sa grille
// sans Albert ; les autres passent par l'attente, puis la grille ou l'échec.
export const deriveEtatImport = ({
  hasFile,
  lecture,
  cibles,
  isCiblesError,
  planImport,
  etapes,
}: {
  hasFile: boolean
  lecture: LectureTableau | undefined
  cibles: CiblesSaisieApiModel | undefined
  isCiblesError: boolean
  planImport: PlanImportResult | undefined
  etapes: ReadonlyArray<EtapePlan>
}): EtatImport => {
  if (!hasFile) return { kind: 'vide' }
  if (!lecture) return { kind: 'lecture' }
  if (!lecture.ok) return { kind: 'illisible', error: lecture.error }
  if (isCiblesError) return { kind: 'echec', explication: CIBLES_INDISPONIBLES }
  if (!cibles) return { kind: 'lecture' }

  const { tableau } = lecture
  const standard = buildPlanStandard({ tableau, cibles })
  if (standard.ok) return { kind: 'grille', tableau, plan: standard.plan, origine: 'STANDARD' }

  if (!planImport) {
    return { kind: 'attente', tableau, etapes: buildEtapesAttente({ tableau, cibles, etapes }) }
  }
  if (!planImport.ok) return { kind: 'echec', explication: planImport.erreur.explication }
  return { kind: 'grille', tableau, plan: planImport.plan, origine: 'ALBERT' }
}

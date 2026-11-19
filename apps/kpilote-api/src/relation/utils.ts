import { type RelationApiModel } from '@pilote/kpilote-shared/relation'

import { type IndividuModel, type RelationModel } from '@/generated/prisma/models'

type IndividuAvecReferentiel = IndividuModel & { referentiel: { publicId: string } }

export type RelationWithIndividus = RelationModel & {
  parent: IndividuAvecReferentiel
  child: IndividuAvecReferentiel
}

export const relationInclude = {
  parent: { include: { referentiel: true } },
  child: { include: { referentiel: true } },
} as const

const toIndividu = (individu: IndividuAvecReferentiel) => ({
  id: individu.publicId,
  nom: individu.nom,
  referentiel: individu.referentiel.publicId,
})

export const toRelationApiModel = (relation: RelationWithIndividus): RelationApiModel => ({
  enfant: toIndividu(relation.child),
  parent: toIndividu(relation.parent),
})

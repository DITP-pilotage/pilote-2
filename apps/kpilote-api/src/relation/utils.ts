import { type RelationApiModel } from '@pilote/kpilote-shared/relation'

import { type IndividuModel, type RelationModel } from '@/generated/prisma/models'

export const MESSAGE_ADMIN = 'Cette opération requiert une clé API de rôle ADMIN'

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

import {
  type IndicateurApiModel,
  type UniteIndicateurApiModel,
  type UniteIndicateurCode,
  UNITES_INDICATEUR_CONFIG,
} from '@pilote/mb-shared/indicateur'

import { type FonctionAgregation, type UniteIndicateur } from '@/generated/prisma/enums'
import { type IndicateurModel, type ReferentielModel } from '@/generated/prisma/models'

export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{
    fonctionAgregation: FonctionAgregation
    referentiel: ReferentielModel
  }>
}

const toUniteIndicateurApiModel = (
  unite: UniteIndicateur | null,
): UniteIndicateurApiModel | null => {
  if (unite === null) return null
  const code = unite as UniteIndicateurCode
  const config = UNITES_INDICATEUR_CONFIG[code]
  return { code, libelle: config.libelle, abbreviation: config.abbreviation }
}

export const toIndicateurApiModel = (
  indicateur: IndicateurWithReferentiels,
): IndicateurApiModel => ({
  id: indicateur.publicId,
  nom: indicateur.nom,
  visibilite: indicateur.visibilite,
  unite: toUniteIndicateurApiModel(indicateur.unite),
  referentiels: indicateur.referentiels
    .map((configuration) => ({
      referentielPublicId: configuration.referentiel.publicId,
      fonctionAgregation: configuration.fonctionAgregation,
    }))
    .sort((a, b) => a.referentielPublicId.localeCompare(b.referentielPublicId)),
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})

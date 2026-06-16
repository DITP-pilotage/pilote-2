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

// Pont enum Prisma → catalogue mb-shared : on throw plutôt que de retourner null
// silencieusement, car une divergence est un défaut de déploiement (enum Prisma
// étendu sans mise à jour de `UNITES_INDICATEUR`), pas une donnée manquante.
const toUniteIndicateurCode = (unite: UniteIndicateur): UniteIndicateurCode => {
  if (unite in UNITES_INDICATEUR_CONFIG) return unite as UniteIndicateurCode
  throw new Error(
    `Unité Prisma '${unite}' absente du catalogue mb-shared (UNITES_INDICATEUR). Ajouter ce code et redéployer.`,
  )
}

const toUniteIndicateurApiModel = (
  unite: UniteIndicateur | null,
): UniteIndicateurApiModel | null => {
  if (unite === null) return null
  const code = toUniteIndicateurCode(unite)
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
  description: indicateur.description,
  methodeCalcul: indicateur.methodeCalcul,
  sourceDonnees: indicateur.sourceDonnees,
  sourceUrl: indicateur.sourceUrl,
  periodeMiseAJour: indicateur.periodeMiseAJour,
  jourMiseAJour: indicateur.jourMiseAJour,
  referentiels: indicateur.referentiels
    .map((configuration) => ({
      id: configuration.referentiel.publicId,
      nom: configuration.referentiel.nom,
      fonctionAgregation: configuration.fonctionAgregation,
    }))
    .sort((a, b) => a.id.localeCompare(b.id)),
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})

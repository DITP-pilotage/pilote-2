import {
  type IndicateurApiModel,
  type UniteIndicateurApiModel,
  type UniteIndicateurCode,
  UNITES_INDICATEUR_CONFIG,
} from '@pilote/mb-shared/indicateur'

import { type FonctionAgregation, type UniteIndicateur } from '@/generated/prisma/enums'
import {
  type IndicateurModel,
  type ReferentielModel,
  type UtilisateurModel,
} from '@/generated/prisma/models'

export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{
    fonctionAgregation: FonctionAgregation
    referentiel: ReferentielModel
  }>
  responsables: Array<{ utilisateur: UtilisateurModel }>
}

// Garde compile-time : l'enum Prisma `UniteIndicateur` et le catalogue mb-shared
// `UNITES_INDICATEUR` doivent lister exactement les mêmes codes. Si une migration
// ajoute une valeur à l'enum Prisma sans l'ajouter au catalogue (ou l'inverse),
// `TypesUnitesSynchronises` devient `false` et cette affectation ne compile plus :
// la divergence est signalée ici au build, avant même le `throw` runtime de
// `toUniteIndicateurCode` ci-dessous.
type TypesUnitesSynchronises = [UniteIndicateur] extends [UniteIndicateurCode]
  ? [UniteIndicateurCode] extends [UniteIndicateur]
    ? true
    : false
  : false
const _assertUnitesSynchronisees: TypesUnitesSynchronises = true

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
  responsables: indicateur.responsables.map(({ utilisateur }) => ({
    email: utilisateur.email,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    service: utilisateur.service,
    fonction: utilisateur.fonction,
  })),
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})

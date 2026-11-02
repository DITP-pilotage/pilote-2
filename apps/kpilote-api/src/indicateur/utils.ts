import {
  type DelaiMiseADisposition,
  type IndicateurApiModel,
  type UniteDuree,
  type UniteIndicateurApiModel,
  type UniteIndicateurCode,
  UNITES_INDICATEUR_CONFIG,
} from '@pilote/kpilote-shared/indicateur'

import { computeDatesMiseADisposition } from '@/indicateur/datesMiseADisposition'

import { type FonctionAgregation, type UniteIndicateur } from '@/generated/prisma/enums'
import {
  type DimensionModel,
  type IndicateurDimensionModel,
  type IndicateurModel,
  type ReferentielModel,
  type UtilisateurModel,
} from '@/generated/prisma/models'

export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{
    fonctionAgregation: FonctionAgregation
    referentiel: ReferentielModel & { dimension: DimensionModel }
  }>
  dimensions: Array<IndicateurDimensionModel & { dimension: DimensionModel }>
  responsables: Array<{ utilisateur: UtilisateurModel }>
}

export const indicateurAvecReferentielsInclude = {
  referentiels: { include: { referentiel: { include: { dimension: true } } } },
  dimensions: { include: { dimension: true } },
  responsables: {
    orderBy: { createdAt: 'asc' },
    include: { utilisateur: true },
  },
} as const

// Dimensions de l'indicateur, déduites de ses niveaux et triées par ordre (cf.
// `dimension/queries/loadIndicateurDimensions.ts` pour la même règle côté calcul).
const toDimensionsApiModel = (
  indicateur: IndicateurWithReferentiels,
): IndicateurApiModel['dimensions'] => {
  const configuration = new Map(indicateur.dimensions.map((d) => [d.dimensionId, d]))
  const parDimension = new Map<string, IndicateurApiModel['dimensions'][number]>()
  for (const { referentiel } of indicateur.referentiels) {
    const config = configuration.get(referentiel.dimensionId)
    const existante = parDimension.get(referentiel.dimensionId) ?? {
      id: referentiel.dimension.publicId,
      nom: referentiel.dimension.nom,
      ordre: config?.ordre ?? Number.MAX_SAFE_INTEGER,
      fonctionAgregation: config?.fonctionAgregation ?? 'SUM',
      porteObjectifs: config?.porteObjectifs ?? false,
      referentiels: [],
    }
    existante.referentiels.push(referentiel.publicId)
    parDimension.set(referentiel.dimensionId, existante)
  }
  return [...parDimension.values()]
    .map((d) => ({ ...d, referentiels: d.referentiels.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => a.ordre - b.ordre || a.id.localeCompare(b.id))
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
  if (unite in UNITES_INDICATEUR_CONFIG) return unite
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

// Recompose le délai stocké en deux colonnes (nombre + unité) en objet, ou
// `null` si l'un des deux manque (invariant les-deux-ou-aucun garanti à l'écriture).
const toDelaiMiseADisposition = (indicateur: {
  delaiMiseADispositionNombre: number | null
  delaiMiseADispositionUnite: UniteDuree | null
}): DelaiMiseADisposition | null =>
  indicateur.delaiMiseADispositionNombre !== null && indicateur.delaiMiseADispositionUnite !== null
    ? {
        nombre: indicateur.delaiMiseADispositionNombre,
        unite: indicateur.delaiMiseADispositionUnite,
      }
    : null

export const toIndicateurApiModel = ({
  indicateur,
  dateDerniereValeur,
}: {
  indicateur: IndicateurWithReferentiels
  dateDerniereValeur: string | null
}): IndicateurApiModel => {
  const delaiMiseADisposition = toDelaiMiseADisposition(indicateur)
  const dates = computeDatesMiseADisposition({
    dateDerniereValeur,
    periodeMiseAJour: indicateur.periodeMiseAJour,
    delai: delaiMiseADisposition,
  })
  return {
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
    delaiMiseADisposition,
    referentiels: indicateur.referentiels
      .map((configuration) => ({
        id: configuration.referentiel.publicId,
        nom: configuration.referentiel.nom,
        fonctionAgregation: configuration.fonctionAgregation,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    dimensions: toDimensionsApiModel(indicateur),
    responsables: indicateur.responsables.map(({ utilisateur }) => ({
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      service: utilisateur.service,
      fonction: utilisateur.fonction,
    })),
    dateDerniereValeur: dates.dateDerniereValeur,
    dateProchaineValeur: dates.dateProchaineValeur,
    dateMiseADisposition: dates.dateMiseADisposition,
    createdAt: indicateur.createdAt.toISOString(),
    updatedAt: indicateur.updatedAt.toISOString(),
  }
}

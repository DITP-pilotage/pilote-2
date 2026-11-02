import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { okAsync, ResultAsync } from 'neverthrow'

import { type DimensionIndicateur } from '@/dimension/queries/loadIndicateurDimensions'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import {
  appliquerPlan,
  appliquerPlanMultiDimension,
  type ItemNormalise,
  type WarningApplication,
} from '@/valeurImport/appliquerPlan'
import { decouvrirStructure, type Plan } from '@/valeurImport/calls/decouvrirStructure'
import {
  resoudreIndividus,
  type ResolutionEntry,
  type ResolutionNonResolu,
} from '@/valeurImport/calls/resoudreIndividus'
import { resoudreTypeValeur } from '@/valeurImport/calls/resoudreTypeValeur'
import {
  choisirDimensionsColonnes,
  type DimensionCandidate,
} from '@/valeurImport/choisirDimensionsColonnes'
import { collecterValeursDistinctes } from '@/valeurImport/helpers/collecterValeursDistinctes'
import { resoudreColonneTypeValeur } from '@/valeurImport/helpers/resoudreColonneTypeValeur'
import { safeStringify } from '@/valeurImport/helpers/safeStringify'
import { listDimensionsForIndicateur } from '@/valeurImport/queries/listDimensionsForIndicateur'
import {
  type IndividuPourImport,
  listIndividusForIndicateur,
} from '@/valeurImport/queries/listIndividusForIndicateur'

export type NormaliserValeursImportResult = {
  plan: Plan
  resolution: {
    mapping: ResolutionEntry[]
    nonResolus: ResolutionNonResolu[]
    // Multi-dimension : dimension retenue pour chaque colonne d'identité, dans
    // l'ordre canonique des coordonnées (ordre des dimensions de l'indicateur).
    colonnesIdentite?: Array<{ colonne: string; dimension: { id: string; nom: string } }>
  }
  items: ItemNormalise[]
  warnings: WarningApplication[]
  rapport: {
    totalLignes: number
    totalItemsProduits: number
    totalLibellesSources: number
    totalLibellesMappes: number
    totalLibellesNonResolus: number
  }
  resolutionTypeValeur?: {
    colonne: string
    typesValeurDistincts: string[]
    typesValeurRetenus: string[]
  }
}

export type NormaliserValeursImportError =
  | { type: 'PLAN_ECHEC'; raison: string; explication: string }
  | { type: 'RESOLUTION_ECHEC'; derniereErreur: unknown }

const collectHeaders = (rows: ReadonlyArray<Record<string, unknown>>): string[] => {
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        ordered.push(key)
      }
    }
  }
  return ordered
}

const extraireLibellesSources = (
  rows: ReadonlyArray<Record<string, unknown>>,
  colonneIndividu: string,
): string[] => {
  const set = new Set<string>()
  for (const row of rows) {
    const valeur = row[colonneIndividu]
    if (valeur === null || valeur === undefined) continue
    const libelle = safeStringify(valeur).trim()
    if (libelle) set.add(libelle)
  }
  return [...set]
}

type ResolutionTypeValeur = NonNullable<NormaliserValeursImportResult['resolutionTypeValeur']>

// Passe 1b (conditionnelle) : résolution sémantique du type de valeur (fichiers PPG).
// On ne retient la colonne que si Albert a fourni un nom valide et réel (il remplit
// parfois ce champ optionnel avec un nom vide ou halluciné). Sinon → null (pas de filtre).
const resoudreEtapeTypeValeur = ({
  plan,
  rows,
  headers,
}: {
  plan: Plan
  rows: Array<Record<string, unknown>>
  headers: string[]
}): ResultAsync<ResolutionTypeValeur | null, NormaliserValeursImportError> => {
  const colonne = resoudreColonneTypeValeur({ colonneTypeValeur: plan.colonneTypeValeur, headers })
  if (!colonne) return okAsync(null)

  const typesValeurDistincts = collecterValeursDistinctes({ rows, colonne })
  return resoudreTypeValeur({ colonne, typesValeurDistincts }).map((res) => ({
    colonne,
    typesValeurDistincts,
    typesValeurRetenus: res.typesValeurRetenus,
  }))
}

type ContexteNormalisation = {
  indicateur: IndicateurApiModel
  individus: IndividuPourImport[]
  rows: Array<Record<string, unknown>>
  headers: string[]
}

// Chemin historique (indicateur mono-dimension) : une colonne d'identité, résolue
// contre tous les individus des référentiels liés. Sortie strictement inchangée.
const normaliserMono = ({
  contexte: { indicateur, individus, rows, headers },
  plan,
}: {
  contexte: ContexteNormalisation
  plan: Plan
}): ResultAsync<NormaliserValeursImportResult, NormaliserValeursImportError> => {
  const libellesSources = extraireLibellesSources(rows, plan.colonneIndividu)

  return resoudreEtapeTypeValeur({ plan, rows, headers }).andThen((resolutionTypeValeur) =>
    resoudreIndividus({
      indicateur: { nom: indicateur.nom },
      individusValides: individus,
      libellesSources,
    }).map((resolution) => {
      const application = appliquerPlan({
        plan,
        rows,
        resolution,
        individusValides: individus,
        typeValeur: resolutionTypeValeur,
      })
      return {
        plan,
        resolution: {
          mapping: [...resolution.mapping],
          nonResolus: [...resolution.nonResolus],
        },
        items: application.items,
        warnings: application.warnings,
        rapport: {
          totalLignes: rows.length,
          totalItemsProduits: application.items.length,
          totalLibellesSources: libellesSources.length,
          totalLibellesMappes: resolution.mapping.length,
          totalLibellesNonResolus: resolution.nonResolus.length,
        },
        ...(resolutionTypeValeur ? { resolutionTypeValeur } : {}),
      }
    }),
  )
}

type DimensionImport = DimensionCandidate & {
  membres: IndividuPourImport[]
  fonctionAgregation: DimensionIndicateur['fonctionAgregation']
}

const warnColonneIdentiteIgnoree = ({
  colonne,
  raison,
}: {
  colonne: string
  raison: string
}): WarningApplication => ({
  code: 'COLONNE_IDENTITE_IGNOREE',
  message: `Colonne « ${colonne} » ignorée : ${raison}`,
  colonneSource: colonne,
})

const warnDimensionsNonCouvertes = (
  dimensions: ReadonlyArray<{ nom: string }>,
): WarningApplication => ({
  code: 'DIMENSIONS_NON_COUVERTES',
  message:
    `Aucune colonne du fichier ne correspond à ${
      dimensions.length > 1 ? 'les dimensions' : 'la dimension'
    } ${dimensions.map((dimension) => `« ${dimension.nom} »`).join(', ')} : ` +
    'ces valeurs agrégées se calculent et ne se saisissent pas (une colonne par dimension est attendue).',
})

// Colonnes d'identité retenues du plan : la première, puis les supplémentaires
// réellement présentes dans le fichier, distinctes, et qui ne sont ni la date, ni
// la valeur, ni une colonne pivot, ni le type de valeur.
const colonnesIdentiteDuPlan = ({
  plan,
  headers,
}: {
  plan: Plan
  headers: ReadonlyArray<string>
}): { colonnes: string[]; ignorees: WarningApplication[] } => {
  const reservees = new Set([
    ...(plan.layout === 'long'
      ? [plan.colonneDate.nom, plan.colonneValeur]
      : plan.colonnesPivot.map((colonne) => colonne.nom)),
    ...(plan.colonneTypeValeur ? [plan.colonneTypeValeur.nom] : []),
  ])
  const enTetes = new Set(headers)
  const colonnes = [plan.colonneIndividu]
  const ignorees: WarningApplication[] = []
  for (const colonne of plan.colonnesIdentiteSupplementaires ?? []) {
    if (colonnes.includes(colonne)) continue
    if (!enTetes.has(colonne)) {
      ignorees.push(warnColonneIdentiteIgnoree({ colonne, raison: 'absente du fichier.' }))
    } else if (reservees.has(colonne)) {
      ignorees.push(
        warnColonneIdentiteIgnoree({ colonne, raison: 'elle porte déjà la date ou la valeur.' }),
      )
    } else {
      colonnes.push(colonne)
    }
  }
  return { colonnes, ignorees }
}

// Plan restitué : colonnes d'identité effectivement rattachées à une dimension,
// dans l'ordre du plan. `colonnesIdentiteSupplementaires` absent s'il n'en reste qu'une.
const planAvecColonnesIdentite = ({ plan, colonnes }: { plan: Plan; colonnes: string[] }): Plan => {
  const { colonnesIdentiteSupplementaires: _ignore, ...base } = plan
  const [premiere = plan.colonneIndividu, ...supplementaires] = colonnes
  return {
    ...base,
    colonneIndividu: premiere,
    ...(supplementaires.length > 0 ? { colonnesIdentiteSupplementaires: supplementaires } : {}),
  }
}

// Indicateur multi-dimension : chaque colonne d'identité est rattachée à une
// dimension puis résolue SÉPARÉMENT contre les seuls membres de celle-ci (un appel
// Albert par colonne). Contrôle de couverture : une colonne n'est exigée que pour
// les dimensions dont la marginale agrège (≠ NONE), cf. dimensions-design §5.5.
const normaliserMulti = ({
  contexte: { indicateur, individus, rows, headers },
  plan: planAlbert,
  dimensions,
}: {
  contexte: ContexteNormalisation
  plan: Plan
  dimensions: ReadonlyArray<DimensionIndicateur>
}): ResultAsync<NormaliserValeursImportResult, NormaliserValeursImportError> => {
  const { colonnes, ignorees } = colonnesIdentiteDuPlan({ plan: planAlbert, headers })
  const libellesParColonne = new Map(
    colonnes.map((colonne) => [colonne, extraireLibellesSources(rows, colonne)]),
  )

  const candidates: DimensionImport[] = dimensions.map((dimension, rang) => {
    const niveaux = new Set(dimension.niveaux.map((niveau) => niveau.publicId))
    return {
      publicId: dimension.publicId,
      nom: dimension.nom,
      rang,
      fonctionAgregation: dimension.fonctionAgregation,
      membres: individus.filter((individu) => niveaux.has(individu.referentielPublicId)),
    }
  })

  const { affectations, colonnesIgnorees } = choisirDimensionsColonnes({
    colonnes: colonnes.map((colonne) => ({
      colonne,
      libelles: libellesParColonne.get(colonne) ?? [],
    })),
    dimensions: candidates,
  })

  const couvertes = new Set(affectations.map(({ dimension }) => dimension.publicId))
  const nonCouvertes = candidates.filter(
    (dimension) => dimension.fonctionAgregation !== 'NONE' && !couvertes.has(dimension.publicId),
  )
  const warningsPlan: WarningApplication[] = [
    ...ignorees,
    ...colonnesIgnorees.map((colonne) =>
      warnColonneIdentiteIgnoree({
        colonne,
        raison: "aucune dimension de l'indicateur ne reste à lui rattacher.",
      }),
    ),
    ...(nonCouvertes.length > 0 ? [warnDimensionsNonCouvertes(nonCouvertes)] : []),
  ]
  const plan = planAvecColonnesIdentite({
    plan: planAlbert,
    colonnes: affectations.map(({ colonne }) => colonne),
  })

  return resoudreEtapeTypeValeur({ plan, rows, headers }).andThen((resolutionTypeValeur) =>
    ResultAsync.combine(
      affectations.map(({ colonne, dimension }) =>
        resoudreIndividus({
          indicateur: { nom: indicateur.nom },
          individusValides: dimension.membres,
          libellesSources: libellesParColonne.get(colonne) ?? [],
          colonne: { nom: colonne, dimension: dimension.nom },
        }).map((resolution) => ({ colonne, dimension, resolution })),
      ),
    ).map((resolues) => {
      const application = appliquerPlanMultiDimension({
        plan,
        rows,
        colonnes: resolues.map(({ colonne, dimension, resolution }) => ({
          colonne,
          rang: dimension.rang,
          resolution,
          membres: dimension.membres,
        })),
        typeValeur: resolutionTypeValeur,
      })
      const mapping = resolues.flatMap(({ colonne, resolution }) =>
        resolution.mapping.map((entree) => ({ ...entree, colonne })),
      )
      const nonResolus = resolues.flatMap(({ colonne, resolution }) =>
        resolution.nonResolus.map((entree) => ({ ...entree, colonne })),
      )
      return {
        plan,
        resolution: {
          mapping,
          nonResolus,
          // Ordre canonique : `colonnesIdentite[i]` est la colonne de `coordonnees[i]`.
          colonnesIdentite: [...resolues]
            .sort((a, b) => a.dimension.rang - b.dimension.rang)
            .map(({ colonne, dimension }) => ({
              colonne,
              dimension: { id: dimension.publicId, nom: dimension.nom },
            })),
        },
        items: application.items,
        warnings: [...warningsPlan, ...application.warnings],
        rapport: {
          totalLignes: rows.length,
          totalItemsProduits: application.items.length,
          totalLibellesSources: affectations.reduce(
            (total, { colonne }) => total + (libellesParColonne.get(colonne)?.length ?? 0),
            0,
          ),
          totalLibellesMappes: mapping.length,
          totalLibellesNonResolus: nonResolus.length,
        },
        ...(resolutionTypeValeur ? { resolutionTypeValeur } : {}),
      }
    }),
  )
}

// Mono-dimension : les colonnes d'identité supplémentaires éventuellement proposées
// par Albert sont retirées (une seule dimension → une seule colonne, plan historique).
const planMono = (plan: Plan): Plan => {
  const { colonnesIdentiteSupplementaires: _ignore, ...base } = plan
  return base
}

export const normaliserValeursImport = (
  indicateurPublicId: string,
  { rows, nomFichier }: { rows: Array<Record<string, unknown>>; nomFichier: string },
): ResultAsync<NormaliserValeursImportResult, NormaliserValeursImportError> =>
  getIndicateurByPublicId(indicateurPublicId)
    .andThen((indicateur) =>
      ResultAsync.combine([
        listIndividusForIndicateur(indicateurPublicId),
        listDimensionsForIndicateur(indicateurPublicId),
      ]).map(([individus, dimensions]) => ({ indicateur, individus, dimensions })),
    )
    .andThen(({ indicateur, individus, dimensions }) => {
      const headers = collectHeaders(rows)
      const multiDimension = dimensions.length > 1
      return decouvrirStructure({
        indicateur: { nom: indicateur.nom, uniteLibelle: indicateur.unite?.libelle ?? null },
        dimensions: dimensions.map((dimension) => dimension.nom),
        headers,
        rows,
        nomFichier,
      }).andThen((plan) => {
        const contexte = { indicateur, individus, rows, headers }
        return multiDimension
          ? normaliserMulti({ contexte, plan, dimensions })
          : normaliserMono({ contexte, plan: planMono(plan) })
      })
    })

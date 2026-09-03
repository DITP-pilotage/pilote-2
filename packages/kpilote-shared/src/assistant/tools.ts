import { z } from 'zod'

import type { CollectionApiModel, CollectionListApiModel } from '../collection'
import type { CollectionTauxProgressionApiModel } from '../collectionTauxProgression'
import type { IndicateurApiModel, IndicateurListApiModel } from '../indicateur'
import type { IndividuListApiModel } from '../individu'
import type { ObjectifIndicateurIndividuListApiModel } from '../objectifIndicateurIndividu'
import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'
import type { ReferentielListApiModel } from '../referentiel'
import type { TauxProgressionListApiModel } from '../tauxProgression'
import { type View } from './tiles'
import type {
  DernieresValeursIndividuListApiModel,
  SyntheseIndividusListApiModel,
  ValeurAvancementListApiModel,
  ValeursRemarquablesListApiModel,
} from '../valeurAvancement'

// Source unique de vérité des noms d'outils. Le serveur les enregistre, le front en dérive
// ses libellés et son nettoyage des pseudo-appels : aucune liste dupliquée ne peut diverger.
// Chez ppg, `AssistantMessageText.tsx` en déclare 7 quand la route en expose 11, et les
// pseudo-appels des 4 manquants passent au travers.
export const TOOL_NAMES = [
  'search_indicateurs',
  'search_collections',
  'get_synthese_indicateur',
  'get_synthese_collection',
  'compose_view',
  'get_indicateurs',
  'get_indicateur',
  'get_indicateur_valeurs',
  'get_collections',
  'get_collection',
  'get_individu_dernieres_valeurs',
  'get_referentiels',
  'get_referentiel_individus',
] as const

export type ToolName = (typeof TOOL_NAMES)[number]

export const TOOL_LABELS: Record<ToolName, string> = {
  search_indicateurs: 'Recherche des indicateurs correspondants',
  search_collections: 'Recherche des collections correspondantes',
  get_synthese_indicateur: "Synthèse de l'indicateur",
  get_synthese_collection: 'Synthèse de la collection',
  compose_view: 'Composition de la vue',
  get_indicateurs: 'Liste des indicateurs',
  get_indicateur: "Détail de l'indicateur",
  get_indicateur_valeurs: "Valeurs de l'indicateur",
  get_collections: 'Liste des collections',
  get_collection: 'Détail de la collection',
  get_individu_dernieres_valeurs: "Dernières valeurs de l'individu",
  get_referentiels: 'Liste des référentiels',
  get_referentiel_individus: 'Individus du référentiel',
}

// --- Schémas d'entrée : source de vérité, le serveur les utilise tels quels --------------

export const searchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe("La formulation de l'utilisateur, telle quelle, sans reformulation."),
})

export const composeViewInputSchema = z.object({
  request: z.string().min(1).describe("Ce que l'utilisateur veut voir, dans ses termes."),
  indicateurs: z.array(indicateurPublicIdSchema).max(8).default([]),
  collections: z.array(collectionPublicIdSchema).max(8).default([]),
  // Au moins un territoire : toute donnée d'indicateur de kpilote est indexée par individu.
  // Sans lui, il n'y a rien à afficher — l'agent doit demander plutôt que de choisir.
  individus: z.array(individuPublicIdSchema).min(1).max(4),
  referentiels: z.array(referentielPublicIdSchema).max(4).default([]),
})

export const indicateurIdInputSchema = z.object({ id: indicateurPublicIdSchema })
export const collectionIdInputSchema = z.object({ id: collectionPublicIdSchema })

// Presque toutes les données d'avancement de kpilote sont indexées par individu : sans
// territoire, les routes de progression, d'objectifs et de variation exigent leur paramètre
// et refusent l'appel. Le territoire est donc optionnel mais déterminant, et son absence
// est rapportée branche par branche plutôt que de faire échouer la synthèse entière.
const optionalTerritoire = individuPublicIdSchema
  .optional()
  .describe(
    "Territoire pour lequel lire la progression, les objectifs et la variation. Sans lui, seules l'identité et la répartition entre territoires sont renvoyées.",
  )

export const syntheseIndicateurInputSchema = z.object({
  id: indicateurPublicIdSchema,
  individuId: optionalTerritoire,
})

export const syntheseCollectionInputSchema = z.object({
  id: collectionPublicIdSchema,
  individuId: optionalTerritoire,
})
export const individuIdInputSchema = z.object({ id: individuPublicIdSchema })

// --- Types de sortie ---------------------------------------------------------------------

/** Un outil dérivé dont l'appel échoue renvoie ceci plutôt que de faire tomber le tour. */
export type ToolError = { error: string }

export type FoundEntite = { publicId: string; nom: string }

export type SearchOutput = {
  results: FoundEntite[]
  /** Vrai quand le pré-filtre déterministe n'a rien donné et qu'on a rechargé le catalogue. */
  fallback: boolean
  /** Renseignée quand `results` est vide, pour que le modèle sache quoi dire. */
  reason?: string
}

/**
 * Une branche de synthèse porte sa raison d'absence plutôt qu'un `null` nu : sans cela le
 * modèle lit un refus de droit comme « pas de données ».
 */
export type SyntheseBranch<T> = { data: T } | { unavailable: string }

export type SyntheseIndicateurOutput = {
  identite: SyntheseBranch<IndicateurApiModel>
  tauxProgression: SyntheseBranch<TauxProgressionListApiModel>
  valeursRemarquables: SyntheseBranch<ValeursRemarquablesListApiModel>
  objectifs: SyntheseBranch<ObjectifIndicateurIndividuListApiModel>
  syntheseIndividus: SyntheseBranch<SyntheseIndividusListApiModel>
}

/** La vue validée, ou la raison d'un refus que le modèle doit rapporter. */
export type ComposeViewOutput = View | ToolError

export type SyntheseCollectionOutput = {
  identite: SyntheseBranch<CollectionApiModel>
  tauxProgression: SyntheseBranch<CollectionTauxProgressionApiModel>
}

/**
 * Le tableau que `KpiloteUIMessage` consomme pour typer les parts d'outil. Sans lui,
 * `part.output` est `unknown` et aucun outil produisant de l'interface n'est rendable —
 * c'est la limite qu'on rencontrerait au premier outil de composition visuelle.
 *
 * Les sorties de la couche métier sont vérifiées à la compilation par l'annotation de retour
 * d'`execute`. Celles de la couche dérivée reprennent le modèle de réponse documenté par la
 * route ; ce sont les tests de route qui en garantissent la forme.
 */
export type KpiloteUITools = {
  search_indicateurs: { input: z.input<typeof searchInputSchema>; output: SearchOutput }
  search_collections: { input: z.input<typeof searchInputSchema>; output: SearchOutput }
  get_synthese_indicateur: {
    input: z.input<typeof syntheseIndicateurInputSchema>
    output: SyntheseIndicateurOutput
  }
  get_synthese_collection: {
    input: z.input<typeof syntheseCollectionInputSchema>
    output: SyntheseCollectionOutput
  }
  compose_view: {
    input: z.input<typeof composeViewInputSchema>
    output: ComposeViewOutput
  }
  get_indicateurs: { input: Record<string, unknown>; output: IndicateurListApiModel | ToolError }
  get_indicateur: {
    input: z.input<typeof indicateurIdInputSchema>
    output: IndicateurApiModel | ToolError
  }
  get_indicateur_valeurs: {
    input: z.input<typeof indicateurIdInputSchema>
    output: ValeurAvancementListApiModel | ToolError
  }
  get_collections: { input: Record<string, unknown>; output: CollectionListApiModel | ToolError }
  get_collection: {
    input: z.input<typeof collectionIdInputSchema>
    output: CollectionApiModel | ToolError
  }
  get_individu_dernieres_valeurs: {
    input: z.input<typeof individuIdInputSchema>
    output: DernieresValeursIndividuListApiModel | ToolError
  }
  get_referentiels: {
    input: Record<string, unknown>
    output: ReferentielListApiModel | ToolError
  }
  get_referentiel_individus: {
    input: { id: string }
    output: IndividuListApiModel | ToolError
  }
}

// Garde de compilation. `expectTypeOf` dans le fichier de test ne mord que si `tsc` tourne
// dessus, ce que le lint de ce paquet ne fait pas. Ici, la garde est dans le source : elle
// est attrapée par le `tsc --noEmit` de kpilote-api, qui importe ce module.
//
// Une entrée manquante rend `_TOOL_COVERAGE` égal à `never` et l'affectation échoue ;
// une entrée en trop échoue sur la seconde branche.
type _ToolCoverage = keyof KpiloteUITools extends ToolName
  ? ToolName extends keyof KpiloteUITools
    ? true
    : never
  : never

const _TOOL_COVERAGE: _ToolCoverage = true
void _TOOL_COVERAGE

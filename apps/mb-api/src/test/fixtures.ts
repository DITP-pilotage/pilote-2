import { uuidv7 } from 'uuidv7'

import { env } from '@/env'
import { hashApiKey } from '@/framework/auth/apiKey'
import { db } from '@/framework/persistence/dbStore'
import {
  type ApiKeyModel,
  type IndicateurModel,
  type IndividuModel,
  type ReferentielIndividuModel,
  type ReferentielModel,
  type RelationModel,
  type ValeurAvancementModel,
} from '@/generated/prisma/models'

// --- Indicateur --------------------------------------------------------------

type IndicateurOverrides = Partial<{ id: string; publicId: string; nom: string }>

const DEFAULT_INDICATEUR = { publicId: 'IND-1', nom: 'Indicateur de test' } as const

const upsertIndicateur = async (o: IndicateurOverrides = {}) => {
  const create = { id: uuidv7(), ...DEFAULT_INDICATEUR, ...o }
  const { id: _id, publicId: _pub, ...update } = o
  if (Object.keys(update).length === 0) {
    const existing = await db().indicateur.findUnique({ where: { publicId: create.publicId } })
    if (existing) return existing
  }
  return db().indicateur.upsert({
    where: { publicId: create.publicId },
    update,
    create,
  })
}

function indicateur(): Promise<IndicateurModel>
function indicateur(override: IndicateurOverrides): Promise<IndicateurModel>
function indicateur(
  o1: IndicateurOverrides,
  o2: IndicateurOverrides,
  ...rest: IndicateurOverrides[]
): Promise<IndicateurModel[]>
async function indicateur(
  ...overrides: IndicateurOverrides[]
): Promise<IndicateurModel | IndicateurModel[]> {
  if (overrides.length <= 1) return upsertIndicateur(overrides[0])
  const results: IndicateurModel[] = []
  for (const o of overrides) results.push(await upsertIndicateur(o))
  return results
}

// --- Référentiel -------------------------------------------------------------

type ReferentielOverrides = Partial<{
  id: string
  publicId: string
  nom: string
  description: string | null
}>

const DEFAULT_REFERENTIEL = {
  publicId: 'REF-TEST',
  nom: 'Référentiel de test',
  description: null,
} as const

const upsertReferentiel = async (o: ReferentielOverrides = {}) => {
  const create = { id: uuidv7(), ...DEFAULT_REFERENTIEL, ...o }
  const { id: _id, publicId: _pub, ...update } = o
  if (Object.keys(update).length === 0) {
    const existing = await db().referentiel.findUnique({ where: { publicId: create.publicId } })
    if (existing) return existing
  }
  return db().referentiel.upsert({
    where: { publicId: create.publicId },
    update,
    create,
  })
}

function referentiel(): Promise<ReferentielModel>
function referentiel(override: ReferentielOverrides): Promise<ReferentielModel>
function referentiel(
  o1: ReferentielOverrides,
  o2: ReferentielOverrides,
  ...rest: ReferentielOverrides[]
): Promise<ReferentielModel[]>
async function referentiel(
  ...overrides: ReferentielOverrides[]
): Promise<ReferentielModel | ReferentielModel[]> {
  if (overrides.length <= 1) return upsertReferentiel(overrides[0])
  const results: ReferentielModel[] = []
  for (const o of overrides) results.push(await upsertReferentiel(o))
  return results
}

// --- Individu ----------------------------------------------------------------

type IndividuOverrides = Partial<{ id: string; publicId: string; nom: string }>

const DEFAULT_INDIVIDU = {
  publicId: 'TEST-1',
  nom: 'Individu de test',
} as const

const upsertIndividu = async (o: IndividuOverrides = {}) => {
  const create = { id: uuidv7(), ...DEFAULT_INDIVIDU, ...o }
  const { id: _id, publicId: _pub, ...update } = o
  if (Object.keys(update).length === 0) {
    const existing = await db().individu.findUnique({ where: { publicId: create.publicId } })
    if (existing) return existing
  }
  return db().individu.upsert({
    where: { publicId: create.publicId },
    update,
    create,
  })
}

function individu(): Promise<IndividuModel>
function individu(override: IndividuOverrides): Promise<IndividuModel>
function individu(
  o1: IndividuOverrides,
  o2: IndividuOverrides,
  ...rest: IndividuOverrides[]
): Promise<IndividuModel[]>
async function individu(
  ...overrides: IndividuOverrides[]
): Promise<IndividuModel | IndividuModel[]> {
  if (overrides.length <= 1) return upsertIndividu(overrides[0])
  const results: IndividuModel[] = []
  for (const o of overrides) results.push(await upsertIndividu(o))
  return results
}

// --- ReferentielIndividu (deps requises) -------------------------------------

type ReferentielIndividuOverrides = {
  referentiel: ReferentielOverrides
  individu: IndividuOverrides
}

const upsertReferentielIndividu = async (o: ReferentielIndividuOverrides) => {
  const referentielRow = await upsertReferentiel(o.referentiel)
  const individuRow = await upsertIndividu(o.individu)
  return db().referentielIndividu.upsert({
    where: {
      referentielId_individuId: {
        referentielId: referentielRow.id,
        individuId: individuRow.id,
      },
    },
    update: {},
    create: { referentielId: referentielRow.id, individuId: individuRow.id },
  })
}

function referentielIndividu(
  override: ReferentielIndividuOverrides,
): Promise<ReferentielIndividuModel>
function referentielIndividu(
  o1: ReferentielIndividuOverrides,
  o2: ReferentielIndividuOverrides,
  ...rest: ReferentielIndividuOverrides[]
): Promise<ReferentielIndividuModel[]>
async function referentielIndividu(
  ...overrides: ReferentielIndividuOverrides[]
): Promise<ReferentielIndividuModel | ReferentielIndividuModel[]> {
  if (overrides.length === 1) return upsertReferentielIndividu(overrides[0]!)
  const results: ReferentielIndividuModel[] = []
  for (const o of overrides) results.push(await upsertReferentielIndividu(o))
  return results
}

// --- Relation (deps requises) ------------------------------------------------

type RelationOverrides = {
  parent: IndividuOverrides
  child: IndividuOverrides
} & Partial<{ id: string }>

const upsertRelation = async (o: RelationOverrides) => {
  const parent = await upsertIndividu(o.parent)
  const child = await upsertIndividu(o.child)
  return db().relation.upsert({
    where: {
      parentId_childId: {
        parentId: parent.id,
        childId: child.id,
      },
    },
    update: {},
    create: { id: o.id ?? uuidv7(), parentId: parent.id, childId: child.id },
  })
}

function relation(override: RelationOverrides): Promise<RelationModel>
function relation(
  o1: RelationOverrides,
  o2: RelationOverrides,
  ...rest: RelationOverrides[]
): Promise<RelationModel[]>
async function relation(
  ...overrides: RelationOverrides[]
): Promise<RelationModel | RelationModel[]> {
  if (overrides.length === 1) return upsertRelation(overrides[0]!)
  const results: RelationModel[] = []
  for (const o of overrides) results.push(await upsertRelation(o))
  return results
}

// --- ValeurAvancement (deps requises) ----------------------------------------

type ValeurAvancementOverrides = {
  indicateur: IndicateurOverrides
  individu: IndividuOverrides
} & Partial<{ id: string; date: string; valeur: number }>

const DEFAULT_VALEUR_AVANCEMENT_DATE = '2024-01-01'
const DEFAULT_VALEUR_AVANCEMENT_VALEUR = 10

const upsertValeurAvancement = async (o: ValeurAvancementOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const individuRow = await upsertIndividu(o.individu)
  const date = o.date ?? DEFAULT_VALEUR_AVANCEMENT_DATE
  const valeur = o.valeur ?? DEFAULT_VALEUR_AVANCEMENT_VALEUR
  return db().valeurAvancement.upsert({
    where: {
      valeur_avancement_unique: {
        indicateurId: indicateurRow.id,
        individuId: individuRow.id,
        date,
      },
    },
    update: { valeur },
    create: {
      id: o.id ?? uuidv7(),
      indicateurId: indicateurRow.id,
      individuId: individuRow.id,
      date,
      valeur,
    },
  })
}

function valeurAvancement(override: ValeurAvancementOverrides): Promise<ValeurAvancementModel>
function valeurAvancement(
  o1: ValeurAvancementOverrides,
  o2: ValeurAvancementOverrides,
  ...rest: ValeurAvancementOverrides[]
): Promise<ValeurAvancementModel[]>
async function valeurAvancement(
  ...overrides: ValeurAvancementOverrides[]
): Promise<ValeurAvancementModel | ValeurAvancementModel[]> {
  if (overrides.length === 1) return upsertValeurAvancement(overrides[0]!)
  const results: ValeurAvancementModel[] = []
  for (const o of overrides) results.push(await upsertValeurAvancement(o))
  return results
}

// --- ApiKey ------------------------------------------------------------------

type ApiKeyOverrides = Partial<{
  id: string
  label: string
  rawKey: string
  prefix: string
  expiresAt: Date | null
  revokedAt: Date | null
  lastUsedAt: Date | null
}>

const DEFAULT_API_KEY = {
  label: 'API key de test',
  rawKey: 'pilote_live_test_default_key_value_xx',
  prefix: 'pilote_live_test_def',
} as const

const upsertApiKey = async (o: ApiKeyOverrides = {}) => {
  const rawKey = o.rawKey ?? DEFAULT_API_KEY.rawKey
  const keyHash = hashApiKey(rawKey, env.API_KEY_HMAC_SECRET)
  const create = {
    id: o.id ?? uuidv7(),
    label: o.label ?? DEFAULT_API_KEY.label,
    keyHash,
    prefix: o.prefix ?? DEFAULT_API_KEY.prefix,
    expiresAt: o.expiresAt ?? null,
    revokedAt: o.revokedAt ?? null,
    lastUsedAt: o.lastUsedAt ?? null,
  }
  const { id: _id, rawKey: _raw, ...update } = o
  if (Object.keys(update).length === 0) {
    const existing = await db().apiKey.findUnique({ where: { keyHash } })
    if (existing) return existing
  }
  return db().apiKey.upsert({
    where: { keyHash },
    update,
    create,
  })
}

function apiKey(): Promise<ApiKeyModel>
function apiKey(override: ApiKeyOverrides): Promise<ApiKeyModel>
function apiKey(
  o1: ApiKeyOverrides,
  o2: ApiKeyOverrides,
  ...rest: ApiKeyOverrides[]
): Promise<ApiKeyModel[]>
async function apiKey(...overrides: ApiKeyOverrides[]): Promise<ApiKeyModel | ApiKeyModel[]> {
  if (overrides.length <= 1) return upsertApiKey(overrides[0])
  const results: ApiKeyModel[] = []
  for (const o of overrides) results.push(await upsertApiKey(o))
  return results
}

export const fixtures = {
  indicateur,
  referentiel,
  individu,
  referentielIndividu,
  relation,
  valeurAvancement,
  apiKey,
}

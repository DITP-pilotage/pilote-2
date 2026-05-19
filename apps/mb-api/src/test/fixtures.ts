import { uuidv7 } from 'uuidv7'

import { env } from '@/env'
import { hashApiKey } from '@/framework/auth/apiKey'
import { db } from '@/framework/persistence/dbStore'
import {
  testApiKeyRawKey,
  testEmail,
  testIndicateurId,
  testIndividuId,
  testReferentielId,
} from '@/test/randomIds'
import {
  type ApiKeyModel,
  type IndicateurModel,
  type IndicateurPermissionModel,
  type IndicateurReferentielModel,
  type IndividuModel,
  type ReferentielModel,
  type RelationModel,
  type UtilisateurModel,
  type ValeurAvancementModel,
} from '@/generated/prisma/models'
import { PermissionAction } from '@/generated/prisma/enums'

// --- Indicateur --------------------------------------------------------------

type IndicateurOverrides = Partial<{ id: string; publicId: string; nom: string }>

const upsertIndicateur = async (o: IndicateurOverrides = {}) => {
  const create = {
    id: uuidv7(),
    publicId: testIndicateurId(),
    nom: 'Indicateur de test',
    ...o,
  }
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

const upsertReferentiel = async (o: ReferentielOverrides = {}) => {
  const create = {
    id: uuidv7(),
    publicId: testReferentielId(),
    nom: 'Référentiel de test',
    description: null,
    ...o,
  }
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

type IndividuOverrides = Partial<{
  id: string
  publicId: string
  nom: string
  referentiel: ReferentielOverrides
}>

const upsertIndividu = async (o: IndividuOverrides = {}) => {
  const publicId = o.publicId ?? testIndividuId()
  const existing = await db().individu.findUnique({ where: { publicId } })

  // Pas d'override referentiel et l'individu existe : on touche pas au rattachement.
  if (existing && !o.referentiel) {
    const { id: _id, publicId: _pub, referentiel: _ref, ...update } = o
    if (Object.keys(update).length === 0) return existing
    return db().individu.update({ where: { id: existing.id }, data: update })
  }

  const referentielRow = await upsertReferentiel(o.referentiel)
  const { id: _id, publicId: _pub, referentiel: _ref, ...rest } = o
  const update = { ...rest, referentielId: referentielRow.id }
  return db().individu.upsert({
    where: { publicId },
    update,
    create: {
      id: o.id ?? uuidv7(),
      publicId,
      nom: o.nom ?? 'Individu de test',
      referentielId: referentielRow.id,
    },
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

// --- IndicateurReferentiel (deps requises) -----------------------------------

type IndicateurReferentielOverrides = {
  indicateur: IndicateurOverrides
  referentiel: ReferentielOverrides
}

const upsertIndicateurReferentiel = async (o: IndicateurReferentielOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const referentielRow = await upsertReferentiel(o.referentiel)
  return db().indicateurReferentiel.upsert({
    where: {
      indicateurId_referentielId: {
        indicateurId: indicateurRow.id,
        referentielId: referentielRow.id,
      },
    },
    update: {},
    create: { indicateurId: indicateurRow.id, referentielId: referentielRow.id },
  })
}

function indicateurReferentiel(
  override: IndicateurReferentielOverrides,
): Promise<IndicateurReferentielModel>
function indicateurReferentiel(
  o1: IndicateurReferentielOverrides,
  o2: IndicateurReferentielOverrides,
  ...rest: IndicateurReferentielOverrides[]
): Promise<IndicateurReferentielModel[]>
async function indicateurReferentiel(
  ...overrides: IndicateurReferentielOverrides[]
): Promise<IndicateurReferentielModel | IndicateurReferentielModel[]> {
  if (overrides.length === 1) return upsertIndicateurReferentiel(overrides[0]!)
  const results: IndicateurReferentielModel[] = []
  for (const o of overrides) results.push(await upsertIndicateurReferentiel(o))
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

type PrincipalIndicateurPermissionOverrides = {
  indicateur: IndicateurOverrides
  action: PermissionAction
}

type ApiKeyOverrides = Partial<{
  id: string
  label: string
  rawKey: string
  prefix: string
  expiresAt: Date | null
  revokedAt: Date | null
  lastUsedAt: Date | null
  permissions: PrincipalIndicateurPermissionOverrides[]
}>

const grantPermissions = async (
  principalId: string,
  permissions: PrincipalIndicateurPermissionOverrides[] | undefined,
): Promise<void> => {
  if (!permissions || permissions.length === 0) return
  for (const p of permissions) {
    await upsertIndicateurPermission({ principalId, ...p })
  }
}

const upsertApiKey = async (o: ApiKeyOverrides = {}) => {
  const rawKey = o.rawKey ?? testApiKeyRawKey()
  const keyHash = hashApiKey(rawKey, env.API_KEY_HMAC_SECRET)
  const create = {
    id: o.id ?? uuidv7(),
    label: o.label ?? 'API key de test',
    keyHash,
    prefix: o.prefix ?? rawKey.slice(0, 20),
    expiresAt: o.expiresAt ?? null,
    revokedAt: o.revokedAt ?? null,
    lastUsedAt: o.lastUsedAt ?? null,
  }
  const { id: _id, rawKey: _raw, permissions, ...update } = o
  const existing = await db().apiKey.findUnique({ where: { keyHash } })
  if (existing) {
    await grantPermissions(existing.id, permissions)
    if (Object.keys(update).length === 0) return existing
    return db().apiKey.update({ where: { keyHash }, data: update })
  }
  await db().principal.create({ data: { id: create.id } })
  const created = await db().apiKey.create({ data: create })
  await grantPermissions(created.id, permissions)
  return created
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

// --- Utilisateur -------------------------------------------------------------

type UtilisateurOverrides = Partial<{
  id: string
  email: string
  providerSub: string | null
  permissions: PrincipalIndicateurPermissionOverrides[]
}>

const upsertUtilisateur = async (o: UtilisateurOverrides = {}) => {
  const email = o.email ?? testEmail()
  const existing = await db().utilisateur.findUnique({ where: { email } })
  if (existing) {
    await grantPermissions(existing.id, o.permissions)
    const { id: _id, email: _email, permissions: _p, ...update } = o
    if (Object.keys(update).length === 0) return existing
    return db().utilisateur.update({ where: { email }, data: update })
  }
  const id = o.id ?? uuidv7()
  const create = {
    id,
    email,
    providerSub: o.providerSub ?? null,
  }
  await db().principal.create({ data: { id } })
  const created = await db().utilisateur.create({ data: create })
  await grantPermissions(created.id, o.permissions)
  return created
}

function utilisateur(): Promise<UtilisateurModel>
function utilisateur(override: UtilisateurOverrides): Promise<UtilisateurModel>
function utilisateur(
  o1: UtilisateurOverrides,
  o2: UtilisateurOverrides,
  ...rest: UtilisateurOverrides[]
): Promise<UtilisateurModel[]>
async function utilisateur(
  ...overrides: UtilisateurOverrides[]
): Promise<UtilisateurModel | UtilisateurModel[]> {
  if (overrides.length <= 1) return upsertUtilisateur(overrides[0])
  const results: UtilisateurModel[] = []
  for (const o of overrides) results.push(await upsertUtilisateur(o))
  return results
}

// --- IndicateurPermission (deps requises) ------------------------------------

type IndicateurPermissionOverrides = {
  principalId: string
  indicateur: IndicateurOverrides
  action: PermissionAction
}

const upsertIndicateurPermission = async (o: IndicateurPermissionOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  return db().indicateurPermission.upsert({
    where: {
      principalId_indicateurId_action: {
        principalId: o.principalId,
        indicateurId: indicateurRow.id,
        action: o.action,
      },
    },
    update: {},
    create: {
      principalId: o.principalId,
      indicateurId: indicateurRow.id,
      action: o.action,
    },
  })
}

function indicateurPermission(
  override: IndicateurPermissionOverrides,
): Promise<IndicateurPermissionModel>
function indicateurPermission(
  o1: IndicateurPermissionOverrides,
  o2: IndicateurPermissionOverrides,
  ...rest: IndicateurPermissionOverrides[]
): Promise<IndicateurPermissionModel[]>
async function indicateurPermission(
  ...overrides: IndicateurPermissionOverrides[]
): Promise<IndicateurPermissionModel | IndicateurPermissionModel[]> {
  if (overrides.length === 1) return upsertIndicateurPermission(overrides[0]!)
  const results: IndicateurPermissionModel[] = []
  for (const o of overrides) results.push(await upsertIndicateurPermission(o))
  return results
}

export const fixtures = {
  indicateur,
  referentiel,
  individu,
  indicateurReferentiel,
  relation,
  valeurAvancement,
  apiKey,
  utilisateur,
  indicateurPermission,
}

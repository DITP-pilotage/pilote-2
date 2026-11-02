import { uuidv7 } from 'uuidv7'

import { cleCellule } from '@/dimension/cellule'
import { env } from '@/env'
import { hashApiKey } from '@/framework/auth/apiKey'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import {
  testApiKeyRawKey,
  testEmail,
  testIndicateurId,
  testIndividuId,
  testCollectionId,
  testReferentielId,
  testWidgetId,
} from '@/test/randomIds'
import {
  type ApiKeyModel,
  type ContactUtileModel,
  type IndicateurModel,
  type IndicateurPermissionModel,
  type IndicateurReferentielModel,
  type IndividuModel,
  type ObjectifIndicateurIndividuModel,
  type OrganismeModel,
  type CollectionContactUtileModel,
  type DimensionModel,
  type IndicateurDimensionModel,
  type IndicateurPermissionPerimetreModel,
  type CollectionModel,
  type CollectionPermissionModel,
  type IndicateurResponsableModel,
  type CollectionResponsableModel,
  type ReferentielModel,
  type ReferentielWidgetModel,
  type RelationModel,
  type FeatureModel,
  type UtilisateurModel,
  type ValeurAvancementModel,
  type WidgetModel,
} from '@/generated/prisma/models'
import {
  ApiKeyRole,
  CollectionPermissionAction,
  IndicateurPermissionAction,
  ProviderType,
  Visibilite,
  type FeatureEtat,
  FonctionAgregation,
  type PeriodeMiseAJour,
  type UniteDuree,
  type UniteIndicateur,
} from '@/generated/prisma/enums'

// --- Indicateur --------------------------------------------------------------

type IndicateurOverrides = Partial<{
  id: string
  publicId: string
  nom: string
  visibilite: Visibilite
  unite: UniteIndicateur | null
  description: string | null
  methodeCalcul: string | null
  sourceDonnees: string | null
  sourceUrl: string | null
  periodeMiseAJour: PeriodeMiseAJour | null
  jourMiseAJour: number | null
  delaiMiseADispositionNombre: number | null
  delaiMiseADispositionUnite: UniteDuree | null
}>

const upsertIndicateur = async (o: IndicateurOverrides = {}) => {
  const create = {
    id: uuidv7(),
    publicId: testIndicateurId(),
    nom: 'Indicateur de test',
    visibilite: Visibilite.PRIVE,
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

// --- Dimension ---------------------------------------------------------------

// Créée hors transaction par `globalSetup` : les tests concurrents la lisent sans
// se bloquer sur son unicité.
export const DIMENSION_TEST_PAR_DEFAUT = 'DIM-TEST-DEFAUT'

type DimensionOverrides = Partial<{
  id: string
  publicId: string
  nom: string
  description: string | null
}>

const upsertDimension = async (o: DimensionOverrides = {}) => {
  const publicId = o.publicId ?? DIMENSION_TEST_PAR_DEFAUT
  const existing = await db().dimension.findUnique({ where: { publicId } })
  const { id: _id, publicId: _pub, ...update } = o
  if (existing && Object.keys(update).length === 0) return existing
  return db().dimension.upsert({
    where: { publicId },
    update,
    create: {
      id: o.id ?? uuidv7(),
      publicId,
      nom: o.nom ?? 'Dimension de test',
      description: o.description ?? null,
    },
  })
}

function dimension(): Promise<DimensionModel>
function dimension(override: DimensionOverrides): Promise<DimensionModel>
function dimension(
  o1: DimensionOverrides,
  o2: DimensionOverrides,
  ...rest: DimensionOverrides[]
): Promise<DimensionModel[]>
async function dimension(
  ...overrides: DimensionOverrides[]
): Promise<DimensionModel | DimensionModel[]> {
  if (overrides.length <= 1) return upsertDimension(overrides[0])
  const results: DimensionModel[] = []
  for (const o of overrides) results.push(await upsertDimension(o))
  return results
}

// --- IndicateurDimension (deps requises) -------------------------------------

type IndicateurDimensionOverrides = {
  indicateur: IndicateurOverrides
  dimension: DimensionOverrides
} & Partial<{ ordre: number; fonctionAgregation: FonctionAgregation; porteObjectifs: boolean }>

const upsertIndicateurDimension = async (o: IndicateurDimensionOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const dimensionRow = await upsertDimension(o.dimension)
  const data = {
    ordre: o.ordre ?? 0,
    fonctionAgregation: o.fonctionAgregation ?? FonctionAgregation.SUM,
    porteObjectifs: o.porteObjectifs ?? true,
  }
  return db().indicateurDimension.upsert({
    where: {
      indicateurId_dimensionId: { indicateurId: indicateurRow.id, dimensionId: dimensionRow.id },
    },
    update: data,
    create: { indicateurId: indicateurRow.id, dimensionId: dimensionRow.id, ...data },
  })
}

function indicateurDimension(
  override: IndicateurDimensionOverrides,
): Promise<IndicateurDimensionModel>
function indicateurDimension(
  o1: IndicateurDimensionOverrides,
  o2: IndicateurDimensionOverrides,
  ...rest: IndicateurDimensionOverrides[]
): Promise<IndicateurDimensionModel[]>
async function indicateurDimension(
  ...overrides: IndicateurDimensionOverrides[]
): Promise<IndicateurDimensionModel | IndicateurDimensionModel[]> {
  if (overrides.length === 1) return upsertIndicateurDimension(overrides[0]!)
  const results: IndicateurDimensionModel[] = []
  for (const o of overrides) results.push(await upsertIndicateurDimension(o))
  return results
}

// --- Cellule (interne) ---------------------------------------------------------

// Cellule d'un indicateur pour un ensemble de membres (une coordonnée par
// individu, dimension = celle de son référentiel). Idempotente.
const upsertCellule = async (indicateurId: string, individus: ReadonlyArray<IndividuModel>) => {
  const referentiels = await db().referentiel.findMany({
    where: { id: { in: individus.map((i) => i.referentielId) } },
    select: { id: true, dimensionId: true },
  })
  const dimensionParReferentiel = new Map(referentiels.map((r) => [r.id, r.dimensionId]))
  const cle = cleCellule(individus.map((i) => i.id))
  const cellule = await db().cellule.upsert({
    where: { indicateurId_cle: { indicateurId, cle } },
    update: {},
    create: { id: uuidv7(), indicateurId, cle },
  })
  await db().celluleCoordonnee.createMany({
    data: individus.map((i) => ({
      celluleId: cellule.id,
      dimensionId: dimensionParReferentiel.get(i.referentielId)!,
      individuId: i.id,
    })),
    skipDuplicates: true,
  })
  return cellule
}

// Cible d'une fixture de fait : `individu` (cellule mono-coordonnée, forme
// historique) ou `individus` (cellule multi-dimension, un membre par dimension).
type CibleFixture = { individu: IndividuOverrides } | { individus: IndividuOverrides[] }

const resoudreCibleFixture = async (indicateurId: string, cible: CibleFixture) => {
  const overrides = 'individus' in cible ? cible.individus : [cible.individu]
  const rows: IndividuModel[] = []
  for (const o of overrides) rows.push(await upsertIndividu(o))
  return upsertCellule(indicateurId, rows)
}

// --- Référentiel -------------------------------------------------------------

type ReferentielOverrides = Partial<{
  id: string
  publicId: string
  nom: string
  description: string | null
  // Dimension dont le référentiel est un niveau. Défaut : la dimension de test
  // partagée (créée par globalSetup) — les référentiels d'un test sont alors
  // des niveaux d'une même dimension, comme le cas historique mono-dimension.
  dimension: DimensionOverrides
}>

const upsertReferentiel = async (o: ReferentielOverrides = {}) => {
  const { dimension: dimensionOverrides, ...champs } = o
  const dimensionRow = await upsertDimension(dimensionOverrides)
  const create = {
    id: uuidv7(),
    publicId: testReferentielId(),
    nom: 'Référentiel de test',
    description: null,
    dimensionId: dimensionRow.id,
    ...champs,
  }
  const { id: _id, publicId: _pub, ...reste } = champs
  const update = dimensionOverrides ? { ...reste, dimensionId: dimensionRow.id } : reste
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
  metadata: Record<string, unknown> | null
  referentiel: ReferentielOverrides
}>

const upsertIndividu = async (o: IndividuOverrides = {}) => {
  const publicId = o.publicId ?? testIndividuId()
  const existing = await db().individu.findUnique({ where: { publicId } })

  // Pas d'override referentiel et l'individu existe : on touche pas au rattachement.
  if (existing && !o.referentiel) {
    const { id: _id, publicId: _pub, referentiel: _ref, metadata: _meta, ...rest } = o
    const update = { ...rest, ...toMetadataData(o.metadata) }
    if (Object.keys(update).length === 0) return existing
    return db().individu.update({ where: { id: existing.id }, data: update })
  }

  const referentielRow = await upsertReferentiel(o.referentiel)
  const { id: _id, publicId: _pub, referentiel: _ref, metadata: _meta, ...rest } = o
  const update = { ...rest, referentielId: referentielRow.id, ...toMetadataData(o.metadata) }
  return db().individu.upsert({
    where: { publicId },
    update,
    create: {
      id: o.id ?? uuidv7(),
      publicId,
      nom: o.nom ?? 'Individu de test',
      referentielId: referentielRow.id,
      ...toMetadataData(o.metadata),
    },
  })
}

const toMetadataData = (
  metadata: Record<string, unknown> | null | undefined,
): { metadata: Prisma.InputJsonValue | typeof Prisma.DbNull } | Record<string, never> => {
  if (metadata === undefined) return {}
  if (metadata === null) return { metadata: Prisma.DbNull }
  return { metadata: metadata as Prisma.InputJsonValue }
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

// --- Widget ------------------------------------------------------------------

type WidgetOverrides = Partial<{
  id: string
  publicId: string
  type: string
  nom: string
  joinKey: string
}>

const upsertWidget = async (o: WidgetOverrides = {}) => {
  const publicId = o.publicId ?? testWidgetId()
  const { id: _id, publicId: _pub, ...rest } = o
  if (Object.keys(rest).length === 0) {
    const existing = await db().widget.findUnique({ where: { publicId } })
    if (existing) return existing
  }
  return db().widget.upsert({
    where: { publicId },
    update: rest,
    create: {
      id: o.id ?? uuidv7(),
      publicId,
      type: o.type ?? 'test-widget',
      nom: o.nom ?? 'Widget de test',
      joinKey: o.joinKey ?? 'testKey',
    },
  })
}

function widget(): Promise<WidgetModel>
function widget(override: WidgetOverrides): Promise<WidgetModel>
function widget(
  o1: WidgetOverrides,
  o2: WidgetOverrides,
  ...rest: WidgetOverrides[]
): Promise<WidgetModel[]>
async function widget(...overrides: WidgetOverrides[]): Promise<WidgetModel | WidgetModel[]> {
  if (overrides.length <= 1) return upsertWidget(overrides[0])
  const results: WidgetModel[] = []
  for (const o of overrides) results.push(await upsertWidget(o))
  return results
}

// --- ReferentielWidget (deps requises) ---------------------------------------

type ReferentielWidgetOverrides = {
  referentiel: ReferentielOverrides
  widget: WidgetOverrides
}

const upsertReferentielWidget = async (o: ReferentielWidgetOverrides) => {
  const referentielRow = await upsertReferentiel(o.referentiel)
  const widgetRow = await upsertWidget(o.widget)
  return db().referentielWidget.upsert({
    where: {
      referentielId_widgetId: {
        referentielId: referentielRow.id,
        widgetId: widgetRow.id,
      },
    },
    update: {},
    create: { referentielId: referentielRow.id, widgetId: widgetRow.id },
  })
}

function referentielWidget(override: ReferentielWidgetOverrides): Promise<ReferentielWidgetModel>
function referentielWidget(
  o1: ReferentielWidgetOverrides,
  o2: ReferentielWidgetOverrides,
  ...rest: ReferentielWidgetOverrides[]
): Promise<ReferentielWidgetModel[]>
async function referentielWidget(
  ...overrides: ReferentielWidgetOverrides[]
): Promise<ReferentielWidgetModel | ReferentielWidgetModel[]> {
  if (overrides.length === 1) return upsertReferentielWidget(overrides[0]!)
  const results: ReferentielWidgetModel[] = []
  for (const o of overrides) results.push(await upsertReferentielWidget(o))
  return results
}

// --- IndicateurReferentiel (deps requises) -----------------------------------

type IndicateurReferentielOverrides = {
  indicateur: IndicateurOverrides
  referentiel: ReferentielOverrides
  fonctionAgregation?: FonctionAgregation
}

const upsertIndicateurReferentiel = async (o: IndicateurReferentielOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const referentielRow = await upsertReferentiel(o.referentiel)
  const fonctionAgregation = o.fonctionAgregation ?? 'SUM'
  return db().indicateurReferentiel.upsert({
    where: {
      indicateurId_referentielId: {
        indicateurId: indicateurRow.id,
        referentielId: referentielRow.id,
      },
    },
    update: { fonctionAgregation },
    create: {
      indicateurId: indicateurRow.id,
      referentielId: referentielRow.id,
      fonctionAgregation,
    },
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
} & CibleFixture &
  Partial<{ id: string; date: string; valeur: number }>

const DEFAULT_VALEUR_AVANCEMENT_DATE = '2024-01-01'
const DEFAULT_VALEUR_AVANCEMENT_VALEUR = 10

const upsertValeurAvancement = async (o: ValeurAvancementOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const celluleRow = await resoudreCibleFixture(indicateurRow.id, o)
  const date = o.date ?? DEFAULT_VALEUR_AVANCEMENT_DATE
  const valeur = o.valeur ?? DEFAULT_VALEUR_AVANCEMENT_VALEUR
  return db().valeurAvancement.upsert({
    where: {
      valeur_avancement_unique: {
        indicateurId: indicateurRow.id,
        celluleId: celluleRow.id,
        date,
      },
    },
    update: { valeur },
    create: {
      id: o.id ?? uuidv7(),
      indicateurId: indicateurRow.id,
      celluleId: celluleRow.id,
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

// --- ObjectifIndicateurIndividu (deps requises) -------------------------------

type ObjectifIndicateurIndividuOverrides = {
  indicateur: IndicateurOverrides
} & CibleFixture &
  Partial<{ id: string; dateCible: string; valeurCible: number }>

const DEFAULT_OBJECTIF_INDICATEUR_INDIVIDU_DATE_CIBLE = '2024-01-01'
const DEFAULT_OBJECTIF_INDICATEUR_INDIVIDU_VALEUR_CIBLE = 100

const upsertObjectifIndicateurIndividu = async (o: ObjectifIndicateurIndividuOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const celluleRow = await resoudreCibleFixture(indicateurRow.id, o)
  const dateCible = o.dateCible ?? DEFAULT_OBJECTIF_INDICATEUR_INDIVIDU_DATE_CIBLE
  const valeurCible = o.valeurCible ?? DEFAULT_OBJECTIF_INDICATEUR_INDIVIDU_VALEUR_CIBLE
  return db().objectifIndicateurIndividu.upsert({
    where: {
      objectif_indicateur_individu_unique: {
        indicateurId: indicateurRow.id,
        celluleId: celluleRow.id,
        dateCible,
      },
    },
    update: { valeurCible },
    create: {
      id: o.id ?? uuidv7(),
      indicateurId: indicateurRow.id,
      celluleId: celluleRow.id,
      dateCible,
      valeurCible,
    },
  })
}

function objectifIndicateurIndividu(
  override: ObjectifIndicateurIndividuOverrides,
): Promise<ObjectifIndicateurIndividuModel>
function objectifIndicateurIndividu(
  o1: ObjectifIndicateurIndividuOverrides,
  o2: ObjectifIndicateurIndividuOverrides,
  ...rest: ObjectifIndicateurIndividuOverrides[]
): Promise<ObjectifIndicateurIndividuModel[]>
async function objectifIndicateurIndividu(
  ...overrides: ObjectifIndicateurIndividuOverrides[]
): Promise<ObjectifIndicateurIndividuModel | ObjectifIndicateurIndividuModel[]> {
  if (overrides.length === 1) return upsertObjectifIndicateurIndividu(overrides[0]!)
  const results: ObjectifIndicateurIndividuModel[] = []
  for (const o of overrides) results.push(await upsertObjectifIndicateurIndividu(o))
  return results
}

// --- Collection ------------------------------------------------------------------

type CollectionOverrides = Partial<{
  id: string
  publicId: string
  nom: string
  description: string | null
  visibilite: Visibilite
  indicateurs: IndicateurOverrides[]
}>

const upsertCollection = async (o: CollectionOverrides = {}) => {
  const publicId = o.publicId ?? testCollectionId()
  const { indicateurs, id: _id, publicId: _pub, ...rest } = o
  const create = {
    id: o.id ?? uuidv7(),
    publicId,
    nom: o.nom ?? 'Collection de test',
    description: o.description ?? null,
    visibilite: o.visibilite ?? Visibilite.PRIVE,
  }
  const collection = await db().collection.upsert({
    where: { publicId },
    update: rest,
    create,
  })
  if (indicateurs) {
    for (const indicateurOverride of indicateurs) {
      const indicateurRow = await upsertIndicateur(indicateurOverride)
      await db().collectionIndicateur.upsert({
        where: {
          collectionId_indicateurId: {
            collectionId: collection.id,
            indicateurId: indicateurRow.id,
          },
        },
        update: {},
        create: { collectionId: collection.id, indicateurId: indicateurRow.id },
      })
    }
  }
  return collection
}

function collection(): Promise<CollectionModel>
function collection(override: CollectionOverrides): Promise<CollectionModel>
function collection(
  o1: CollectionOverrides,
  o2: CollectionOverrides,
  ...rest: CollectionOverrides[]
): Promise<CollectionModel[]>
async function collection(
  ...overrides: CollectionOverrides[]
): Promise<CollectionModel | CollectionModel[]> {
  if (overrides.length <= 1) return upsertCollection(overrides[0])
  const results: CollectionModel[] = []
  for (const o of overrides) results.push(await upsertCollection(o))
  return results
}

// --- ApiKey ------------------------------------------------------------------

type PrincipalIndicateurPermissionOverrides = {
  indicateur: IndicateurOverrides
  action: IndicateurPermissionAction
}

type PrincipalCollectionPermissionOverrides = {
  collection: CollectionOverrides
  action: CollectionPermissionAction
}

type ApiKeyOverrides = Partial<{
  id: string
  label: string
  rawKey: string
  prefix: string
  role: ApiKeyRole
  expiresAt: Date | null
  revokedAt: Date | null
  lastUsedAt: Date | null
  permissions: PrincipalIndicateurPermissionOverrides[]
  collectionPermissions: PrincipalCollectionPermissionOverrides[]
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

const grantCollectionPermissions = async (
  principalId: string,
  permissions: PrincipalCollectionPermissionOverrides[] | undefined,
): Promise<void> => {
  if (!permissions || permissions.length === 0) return
  for (const p of permissions) {
    await upsertCollectionPermission({ principalId, ...p })
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
    role: o.role ?? ApiKeyRole.CONTRIBUTOR,
    expiresAt: o.expiresAt ?? null,
    revokedAt: o.revokedAt ?? null,
    lastUsedAt: o.lastUsedAt ?? null,
  }
  const { id: _id, rawKey: _raw, permissions, collectionPermissions, ...update } = o
  const existing = await db().apiKey.findUnique({ where: { keyHash } })
  if (existing) {
    await grantPermissions(existing.id, permissions)
    await grantCollectionPermissions(existing.id, collectionPermissions)
    if (Object.keys(update).length === 0) return existing
    return db().apiKey.update({ where: { keyHash }, data: update })
  }
  await db().principal.create({ data: { id: create.id } })
  const created = await db().apiKey.create({ data: create })
  await grantPermissions(created.id, permissions)
  await grantCollectionPermissions(created.id, collectionPermissions)
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
  nom: string
  prenom: string
  service: string
  fonction: string
  identite: { provider: ProviderType; providerSub: string }
  permissions: PrincipalIndicateurPermissionOverrides[]
  collectionPermissions: PrincipalCollectionPermissionOverrides[]
}>

const upsertUtilisateur = async (o: UtilisateurOverrides = {}) => {
  const email = o.email ?? testEmail()
  const existing = await db().utilisateur.findUnique({ where: { email } })
  if (existing) {
    await grantPermissions(existing.id, o.permissions)
    await grantCollectionPermissions(existing.id, o.collectionPermissions)
    return existing
  }
  const id = o.id ?? uuidv7()
  await db().principal.create({ data: { id } })
  const created = await db().utilisateur.create({
    data: {
      id,
      email,
      nom: o.nom ?? 'Doe',
      prenom: o.prenom ?? 'John',
      service: o.service ?? 'DITP',
      fonction: o.fonction ?? 'Agent',
    },
  })
  if (o.identite) {
    await db().identiteExterne.create({
      data: {
        provider: o.identite.provider,
        providerSub: o.identite.providerSub,
        utilisateurId: id,
      },
    })
  }
  await grantPermissions(created.id, o.permissions)
  await grantCollectionPermissions(created.id, o.collectionPermissions)
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
  action: IndicateurPermissionAction
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

// --- IndicateurPermissionPerimetre (deps requises) ---------------------------

// Pose atomiquement une permission WRITE_DATA restreinte et son périmètre
// (membres de dimension, descendants inclus). `membres: []` = restreinte sans
// périmètre : aucune écriture (fail-closed).
type IndicateurPermissionPerimetreOverrides = {
  principalId: string
  indicateur: IndicateurOverrides
  membres: IndividuOverrides[]
}

async function indicateurPermissionPerimetre(
  o: IndicateurPermissionPerimetreOverrides,
): Promise<IndicateurPermissionPerimetreModel[]> {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const cle = {
    principalId: o.principalId,
    indicateurId: indicateurRow.id,
    action: IndicateurPermissionAction.WRITE_DATA,
  }
  await db().indicateurPermission.upsert({
    where: { principalId_indicateurId_action: cle },
    update: { perimetreRestreint: true },
    create: { ...cle, perimetreRestreint: true },
  })
  const lignes: IndicateurPermissionPerimetreModel[] = []
  for (const membre of o.membres) {
    const individuRow = await upsertIndividu(membre)
    lignes.push(
      await db().indicateurPermissionPerimetre.upsert({
        where: {
          principalId_indicateurId_action_individuId: { ...cle, individuId: individuRow.id },
        },
        update: {},
        create: { ...cle, individuId: individuRow.id },
      }),
    )
  }
  return lignes
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

// --- CollectionPermission (deps requises) ----------------------------------------

type CollectionPermissionOverrides = {
  principalId: string
  collection: CollectionOverrides
  action: CollectionPermissionAction
}

const upsertCollectionPermission = async (o: CollectionPermissionOverrides) => {
  const collectionRow = await upsertCollection(o.collection)
  return db().collectionPermission.upsert({
    where: {
      principalId_collectionId_action: {
        principalId: o.principalId,
        collectionId: collectionRow.id,
        action: o.action,
      },
    },
    update: {},
    create: {
      principalId: o.principalId,
      collectionId: collectionRow.id,
      action: o.action,
    },
  })
}

function collectionPermission(
  override: CollectionPermissionOverrides,
): Promise<CollectionPermissionModel>
function collectionPermission(
  o1: CollectionPermissionOverrides,
  o2: CollectionPermissionOverrides,
  ...rest: CollectionPermissionOverrides[]
): Promise<CollectionPermissionModel[]>
async function collectionPermission(
  ...overrides: CollectionPermissionOverrides[]
): Promise<CollectionPermissionModel | CollectionPermissionModel[]> {
  if (overrides.length === 1) return upsertCollectionPermission(overrides[0]!)
  const results: CollectionPermissionModel[] = []
  for (const o of overrides) results.push(await upsertCollectionPermission(o))
  return results
}

// --- CollectionResponsable (deps requises) ----------------------------------------

type CollectionResponsableOverrides = {
  collection: CollectionOverrides
  utilisateur: UtilisateurOverrides
}

const upsertCollectionResponsable = async (o: CollectionResponsableOverrides) => {
  const collectionRow = await upsertCollection(o.collection)
  const utilisateurRow = await upsertUtilisateur(o.utilisateur)
  return db().collectionResponsable.upsert({
    where: {
      collectionId_utilisateurId: {
        collectionId: collectionRow.id,
        utilisateurId: utilisateurRow.id,
      },
    },
    update: {},
    create: { collectionId: collectionRow.id, utilisateurId: utilisateurRow.id },
  })
}

function collectionResponsable(
  override: CollectionResponsableOverrides,
): Promise<CollectionResponsableModel>
function collectionResponsable(
  o1: CollectionResponsableOverrides,
  o2: CollectionResponsableOverrides,
  ...rest: CollectionResponsableOverrides[]
): Promise<CollectionResponsableModel[]>
async function collectionResponsable(
  ...overrides: CollectionResponsableOverrides[]
): Promise<CollectionResponsableModel | CollectionResponsableModel[]> {
  if (overrides.length === 1) return upsertCollectionResponsable(overrides[0]!)
  const results: CollectionResponsableModel[] = []
  for (const o of overrides) results.push(await upsertCollectionResponsable(o))
  return results
}

// --- IndicateurResponsable (deps requises) -----------------------------------

type IndicateurResponsableOverrides = {
  indicateur: IndicateurOverrides
  utilisateur: UtilisateurOverrides
}

const upsertIndicateurResponsable = async (o: IndicateurResponsableOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const utilisateurRow = await upsertUtilisateur(o.utilisateur)
  return db().indicateurResponsable.upsert({
    where: {
      indicateurId_utilisateurId: {
        indicateurId: indicateurRow.id,
        utilisateurId: utilisateurRow.id,
      },
    },
    update: {},
    create: { indicateurId: indicateurRow.id, utilisateurId: utilisateurRow.id },
  })
}

function indicateurResponsable(
  override: IndicateurResponsableOverrides,
): Promise<IndicateurResponsableModel>
function indicateurResponsable(
  o1: IndicateurResponsableOverrides,
  o2: IndicateurResponsableOverrides,
  ...rest: IndicateurResponsableOverrides[]
): Promise<IndicateurResponsableModel[]>
async function indicateurResponsable(
  ...overrides: IndicateurResponsableOverrides[]
): Promise<IndicateurResponsableModel | IndicateurResponsableModel[]> {
  if (overrides.length === 1) return upsertIndicateurResponsable(overrides[0]!)
  const results: IndicateurResponsableModel[] = []
  for (const o of overrides) results.push(await upsertIndicateurResponsable(o))
  return results
}

// --- Commentaire (indicateur + individu) -------------------------------------

type CommentaireOverrides = {
  indicateur: IndicateurOverrides
  createdBy: string
} & CibleFixture &
  Partial<{
    id: string
    contenu: string
    contenuTexte: string
    statut: 'BROUILLON' | 'PUBLIE'
    type: 'DEFAUT' | 'CONFIANCE'
  }>

const upsertCommentaire = async (o: CommentaireOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const celluleRow = await resoudreCibleFixture(indicateurRow.id, o)
  return db().commentaire.create({
    data: {
      id: o.id ?? uuidv7(),
      contenu: o.contenu ?? '<p>Commentaire de test</p>',
      contenuTexte: o.contenuTexte ?? 'Commentaire de test',
      statut: o.statut ?? 'PUBLIE',
      createdBy: o.createdBy,
      updatedBy: o.createdBy,
      indicateurIndividu: {
        create: {
          indicateurId: indicateurRow.id,
          celluleId: celluleRow.id,
          type: o.type ?? 'DEFAUT',
        },
      },
    },
    include: { indicateurIndividu: true },
  })
}

async function commentaire(override: CommentaireOverrides) {
  return upsertCommentaire(override)
}

// --- Organisme ---------------------------------------------------------------

type OrganismeOverrides = Partial<{
  id: string
  nom: string
}>

const upsertOrganisme = async (o: OrganismeOverrides = {}): Promise<OrganismeModel> => {
  const id = o.id ?? uuidv7()
  return db().organisme.upsert({
    where: { id },
    update: { nom: o.nom ?? 'Organisme Test' },
    create: {
      id,
      nom: o.nom ?? 'Organisme Test',
    },
  })
}

function organisme(): Promise<OrganismeModel>
function organisme(override: OrganismeOverrides): Promise<OrganismeModel>
async function organisme(override?: OrganismeOverrides): Promise<OrganismeModel> {
  return upsertOrganisme(override)
}

// --- ContactUtile ------------------------------------------------------------

type ContactUtileOverrides = Partial<{
  id: string
  nom: string
  description: string | null
  telephone: string | null
  email: string | null
  url: string | null
  adresse: string | null
  organisme: OrganismeOverrides
}>

const upsertContactUtile = async (o: ContactUtileOverrides = {}): Promise<ContactUtileModel> => {
  const organismeRow = await upsertOrganisme(o.organisme)
  const id = o.id ?? uuidv7()
  return db().contactUtile.upsert({
    where: { id },
    update: {},
    create: {
      id,
      organismeId: organismeRow.id,
      nom: o.nom ?? 'Contact Test',
      description: o.description ?? null,
      telephone: o.telephone ?? null,
      email: o.email ?? null,
      url: o.url ?? null,
      adresse: o.adresse ?? null,
    },
  })
}

function contactUtile(): Promise<ContactUtileModel>
function contactUtile(override: ContactUtileOverrides): Promise<ContactUtileModel>
async function contactUtile(override?: ContactUtileOverrides): Promise<ContactUtileModel> {
  return upsertContactUtile(override)
}

// --- CollectionContactUtile ------------------------------------------------------

type CollectionContactUtileOverrides = {
  collection?: CollectionOverrides
  contactUtile?: ContactUtileOverrides
}

const upsertCollectionContactUtile = async (
  o: CollectionContactUtileOverrides,
): Promise<CollectionContactUtileModel> => {
  const collectionRow = await upsertCollection(o.collection)
  const contactUtileRow = await upsertContactUtile(o.contactUtile)
  return db().collectionContactUtile.upsert({
    where: {
      collectionId_contactUtileId: {
        collectionId: collectionRow.id,
        contactUtileId: contactUtileRow.id,
      },
    },
    update: {},
    create: { collectionId: collectionRow.id, contactUtileId: contactUtileRow.id },
  })
}

function collectionContactUtile(
  override: CollectionContactUtileOverrides,
): Promise<CollectionContactUtileModel>
async function collectionContactUtile(
  override: CollectionContactUtileOverrides,
): Promise<CollectionContactUtileModel> {
  return upsertCollectionContactUtile(override)
}

// --- Feature ---------------------------------------------------------

type FeatureOverrides = Partial<{
  id: string
  key: string
  nom: string
  etat: FeatureEtat
  utilisateurs: { id: string }[]
}>

let featureSeq = 0

const upsertFeature = async (o: FeatureOverrides = {}) => {
  const id = o.id ?? uuidv7()
  featureSeq += 1
  const created = await db().feature.create({
    data: {
      id,
      key: o.key ?? `FEATURE_TEST_${featureSeq}`,
      nom: o.nom ?? 'Feature de test',
      etat: o.etat ?? 'DESACTIVE',
    },
  })
  for (const utilisateur of o.utilisateurs ?? []) {
    await db().featureUtilisateur.create({
      data: { featureId: id, utilisateurId: utilisateur.id },
    })
  }
  return created
}

function feature(): Promise<FeatureModel>
function feature(override: FeatureOverrides): Promise<FeatureModel>
async function feature(o?: FeatureOverrides): Promise<FeatureModel> {
  return upsertFeature(o)
}

export const fixtures = {
  indicateur,
  dimension,
  indicateurDimension,
  indicateurPermissionPerimetre,
  feature,
  commentaire,
  referentiel,
  individu,
  widget,
  referentielWidget,
  indicateurReferentiel,
  relation,
  valeurAvancement,
  objectifIndicateurIndividu,
  collection,
  apiKey,
  utilisateur,
  indicateurPermission,
  collectionPermission,
  collectionResponsable,
  indicateurResponsable,
  organisme,
  contactUtile,
  collectionContactUtile,
}

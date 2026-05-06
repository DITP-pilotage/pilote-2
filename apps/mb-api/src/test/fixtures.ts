import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'
import {
  type IndicateurModel,
  type IndividuModel,
  type ReferentielIndividuModel,
  type ReferentielModel,
  type RelationModel,
  type ValeurAvancementModel,
} from '@/generated/prisma/models'

type IndicateurOverrides = Partial<{ id: string; publicId: string; nom: string }>

const DEFAULT_INDICATEUR = { publicId: 'IND-1', nom: 'Indicateur de test' } as const

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
  const upsert = (o: IndicateurOverrides = {}) => {
    const data = { id: uuidv7(), ...DEFAULT_INDICATEUR, ...o }
    return db().indicateur.upsert({
      where: { publicId: data.publicId },
      update: { nom: data.nom },
      create: data,
    })
  }

  if (overrides.length <= 1) return upsert(overrides[0])
  return Promise.all(overrides.map(upsert))
}

type ReferentielOverrides = Partial<{
  id: string
  publicId: string
  nom: string
  description: string | null
}>

const DEFAULT_REFERENTIEL = {
  publicId: 'REF-test',
  nom: 'Référentiel de test',
  description: null,
} as const

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
  const upsert = (o: ReferentielOverrides = {}) => {
    const data = { id: uuidv7(), ...DEFAULT_REFERENTIEL, ...o }
    return db().referentiel.upsert({
      where: { publicId: data.publicId },
      update: { nom: data.nom, description: data.description },
      create: data,
    })
  }

  if (overrides.length <= 1) return upsert(overrides[0])
  return Promise.all(overrides.map(upsert))
}

type IndividuOverrides = Partial<{ id: string; publicId: string; nom: string }>

const DEFAULT_INDIVIDU = {
  publicId: 'Test-1',
  nom: 'Individu de test',
} as const

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
  const upsert = (o: IndividuOverrides = {}) => {
    const merged = { id: uuidv7(), ...DEFAULT_INDIVIDU, ...o }
    return db().individu.upsert({
      where: { publicId: merged.publicId },
      update: { nom: merged.nom },
      create: { id: merged.id, publicId: merged.publicId, nom: merged.nom },
    })
  }

  if (overrides.length <= 1) return upsert(overrides[0])
  return Promise.all(overrides.map(upsert))
}

type ReferentielIndividuOverrides = Partial<{
  referentielPublicId: string
  individuPublicId: string
}>

const DEFAULT_REFERENTIEL_INDIVIDU = {
  referentielPublicId: DEFAULT_REFERENTIEL.publicId,
  individuPublicId: DEFAULT_INDIVIDU.publicId,
} as const

const upsertReferentielIndividu = async (o: ReferentielIndividuOverrides = {}) => {
  const merged = { ...DEFAULT_REFERENTIEL_INDIVIDU, ...o }
  const referentielRow = await db().referentiel.findUniqueOrThrow({
    where: { publicId: merged.referentielPublicId },
    select: { id: true },
  })
  const individuRow = await db().individu.findUniqueOrThrow({
    where: { publicId: merged.individuPublicId },
    select: { id: true },
  })
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

function referentielIndividu(): Promise<ReferentielIndividuModel>
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
  if (overrides.length <= 1) return upsertReferentielIndividu(overrides[0])
  return Promise.all(overrides.map(upsertReferentielIndividu))
}

type RelationOverrides = Partial<{
  id: string
  type: string
  parentPublicId: string
  childPublicId: string
}>

const DEFAULT_RELATION = {
  type: 'parent-child',
  parentPublicId: 'Parent-1',
  childPublicId: 'Child-1',
} as const

const upsertRelation = async (o: RelationOverrides = {}) => {
  const merged = { id: uuidv7(), ...DEFAULT_RELATION, ...o }
  const parent = await db().individu.findUniqueOrThrow({
    where: { publicId: merged.parentPublicId },
    select: { id: true },
  })
  const child = await db().individu.findUniqueOrThrow({
    where: { publicId: merged.childPublicId },
    select: { id: true },
  })
  return db().relation.upsert({
    where: {
      type_parentId_childId: {
        type: merged.type,
        parentId: parent.id,
        childId: child.id,
      },
    },
    update: {},
    create: { id: merged.id, type: merged.type, parentId: parent.id, childId: child.id },
  })
}

function relation(): Promise<RelationModel>
function relation(override: RelationOverrides): Promise<RelationModel>
function relation(
  o1: RelationOverrides,
  o2: RelationOverrides,
  ...rest: RelationOverrides[]
): Promise<RelationModel[]>
async function relation(
  ...overrides: RelationOverrides[]
): Promise<RelationModel | RelationModel[]> {
  if (overrides.length <= 1) return upsertRelation(overrides[0])
  return Promise.all(overrides.map(upsertRelation))
}

type ValeurAvancementOverrides = Partial<{
  id: string
  indicateurPublicId: string
  individuPublicId: string
  dateObservation: string
  valeur: string
}>

const DEFAULT_VALEUR_AVANCEMENT = {
  indicateurPublicId: DEFAULT_INDICATEUR.publicId,
  individuPublicId: DEFAULT_INDIVIDU.publicId,
  dateObservation: '2024-01-01',
  valeur: '10.000000',
} as const

const upsertValeurAvancement = async (o: ValeurAvancementOverrides = {}) => {
  const merged = { id: uuidv7(), ...DEFAULT_VALEUR_AVANCEMENT, ...o }
  const indicateurRow = await db().indicateur.findUniqueOrThrow({
    where: { publicId: merged.indicateurPublicId },
    select: { id: true },
  })
  const individuRow = await db().individu.findUniqueOrThrow({
    where: { publicId: merged.individuPublicId },
    select: { id: true },
  })
  return db().valeurAvancement.upsert({
    where: {
      valeur_avancement_unique_obs: {
        indicateurId: indicateurRow.id,
        individuId: individuRow.id,
        dateObservation: merged.dateObservation,
      },
    },
    update: { valeur: merged.valeur },
    create: {
      id: merged.id,
      indicateurId: indicateurRow.id,
      individuId: individuRow.id,
      dateObservation: merged.dateObservation,
      valeur: merged.valeur,
    },
  })
}

function valeurAvancement(): Promise<ValeurAvancementModel>
function valeurAvancement(override: ValeurAvancementOverrides): Promise<ValeurAvancementModel>
function valeurAvancement(
  o1: ValeurAvancementOverrides,
  o2: ValeurAvancementOverrides,
  ...rest: ValeurAvancementOverrides[]
): Promise<ValeurAvancementModel[]>
async function valeurAvancement(
  ...overrides: ValeurAvancementOverrides[]
): Promise<ValeurAvancementModel | ValeurAvancementModel[]> {
  if (overrides.length <= 1) return upsertValeurAvancement(overrides[0])
  return Promise.all(overrides.map(upsertValeurAvancement))
}

export const fixtures = {
  indicateur,
  referentiel,
  individu,
  referentielIndividu,
  relation,
  valeurAvancement,
}

import { type IndicateurApiModel, indicateurApiModelSchema } from '@pilote/mb-shared/indicateur'
import { type MeApiModel, meApiModelSchema } from '@pilote/mb-shared/me'
import {
  type MePermissionsApiModel,
  mePermissionsApiModelSchema,
} from '@pilote/mb-shared/mePermissions'
import { type ReferentielApiModel, referentielApiModelSchema } from '@pilote/mb-shared/referentiel'

export const buildMe = (override: Partial<MeApiModel> = {}): MeApiModel =>
  meApiModelSchema.parse({
    userId: 'sub-test',
    prenom: 'Admin',
    nom: 'DITP',
    ...override,
  })

export const buildMePermissions = (
  override: Partial<MePermissionsApiModel> = {},
): MePermissionsApiModel =>
  mePermissionsApiModelSchema.parse({
    paniers: [],
    indicateurs: [],
    ...override,
  })

export const buildIndicateur = (override: Partial<IndicateurApiModel> = {}): IndicateurApiModel =>
  indicateurApiModelSchema.parse({
    id: 1,
    nom: 'Indicateur test',
    visibilite: 'PRIVE',
    valeur: 0,
    unite: '%',
    statut: 'actif',
    description: 'Description test',
    referentielIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...override,
  })

export const buildIndicateursList = (items: IndicateurApiModel[] = []) => ({
  items,
  pagination: { cursor: null, hasMore: false },
  total: items.length,
})

export const buildReferentiel = (
  override: Partial<ReferentielApiModel> = {},
): ReferentielApiModel =>
  referentielApiModelSchema.parse({
    id: 'REF-NAT',
    nom: 'National',
    description: null,
    nombreIndividus: 0,
    widgets: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...override,
  })

export const buildReferentielsList = (items: ReferentielApiModel[] = []) => ({
  items,
  pagination: { cursor: null, hasMore: false },
  total: items.length,
})

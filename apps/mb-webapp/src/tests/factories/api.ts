import {
  type IndicateurApiModel,
  indicateurApiModelSchema,
  type MeApiModel,
  meApiModelSchema,
} from '@pilote/mb-shared/api'

export const buildMe = (override: Partial<MeApiModel> = {}): MeApiModel =>
  meApiModelSchema.parse({
    userId: 'sub-test',
    source: 'jwt',
    ...override,
  })

export const buildIndicateur = (
  override: Partial<IndicateurApiModel> = {},
): IndicateurApiModel =>
  indicateurApiModelSchema.parse({
    id: 1,
    nom: 'Indicateur test',
    valeur: 0,
    unite: '%',
    statut: 'actif',
    description: 'Description test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...override,
  })

export const buildIndicateursList = (items: IndicateurApiModel[] = []) => ({
  items,
  pagination: { cursor: null, hasMore: false },
  total: items.length,
})

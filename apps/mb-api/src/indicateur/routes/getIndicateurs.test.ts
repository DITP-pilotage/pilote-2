import type { IndicateurListAPI } from '@pilote/mb-shared'
import { describe, expect, it } from 'vitest'

import { getIndicateurs } from '@/indicateur/routes/getIndicateurs'

describe('GET /indicateurs', () => {
  it('retourne tous les indicateurs sans filtre', async () => {
    const response = await getIndicateurs.request('/indicateurs')
    const body = (await response.json()) as IndicateurListAPI

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(8)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.total).toBe(8)
  })

  it('filtre par statut', async () => {
    const response = await getIndicateurs.request('/indicateurs?statut=archive')
    const body = (await response.json()) as IndicateurListAPI

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]?.statut).toBe('archive')
  })

  it('filtre par recherche (nom, case-insensitive)', async () => {
    const response = await getIndicateurs.request('/indicateurs?recherche=fibre')
    const body = (await response.json()) as IndicateurListAPI

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]?.nom).toContain('fibre')
  })

  it('pagine avec cursor (taille de page 3)', async () => {
    const r1 = await getIndicateurs.request('/indicateurs')
    const b1 = (await r1.json()) as IndicateurListAPI
    expect(b1.items).toHaveLength(8)

    const r2 = await getIndicateurs.request('/indicateurs?cursor=3')
    const b2 = (await r2.json()) as IndicateurListAPI
    expect(b2.items.length).toBeGreaterThan(0)
    expect(b2.items[0]?.id).toBeGreaterThan(3)
  })
})

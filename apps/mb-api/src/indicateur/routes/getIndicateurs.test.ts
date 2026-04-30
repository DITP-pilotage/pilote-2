// Import the route first so @hono/zod-openapi extends the Zod prototype
// before mb-shared schemas are evaluated.
import { getIndicateurs } from '@/indicateur/routes/getIndicateurs'
import { indicateurListApiModelSchema } from '@pilote/mb-shared'
import { describe, expect, it } from 'vitest'

describe('GET /indicateurs', () => {
  it('retourne la première page sans filtre (5 items, hasMore=true)', async () => {
    const response = await getIndicateurs.request('/indicateurs')
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(5)
    expect(body.items[0]?.id).toBe(1)
    expect(body.pagination.hasMore).toBe(true)
    expect(body.pagination.cursor).toBe('5')
    expect(body.total).toBe(8)
  })

  it('paginate end-to-end : suit le cursor jusqu\'à hasMore=false', async () => {
    const r1 = await getIndicateurs.request('/indicateurs')
    const b1 = indicateurListApiModelSchema.parse(await r1.json())
    expect(b1.pagination.hasMore).toBe(true)
    expect(b1.pagination.cursor).not.toBeNull()

    const r2 = await getIndicateurs.request(
      `/indicateurs?cursor=${b1.pagination.cursor}`,
    )
    const b2 = indicateurListApiModelSchema.parse(await r2.json())

    expect(b2.items).toHaveLength(3)
    expect(b2.items.every((i) => i.id > 5)).toBe(true)
    expect(b2.pagination.hasMore).toBe(false)
    expect(b2.pagination.cursor).toBeNull()
    expect(b2.total).toBe(8)
  })

  it('cursor au-delà du dernier id retourne une page vide', async () => {
    const response = await getIndicateurs.request('/indicateurs?cursor=9999')
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(0)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.pagination.cursor).toBeNull()
  })

  it('filtre par statut', async () => {
    const response = await getIndicateurs.request('/indicateurs?statut=archive')
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]?.statut).toBe('archive')
    expect(body.total).toBe(1)
  })

  it('filtre par recherche (nom, case-insensitive)', async () => {
    const response = await getIndicateurs.request('/indicateurs?recherche=fibre')
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]?.nom).toContain('fibre')
  })

  it('retourne une liste vide quand aucune correspondance', async () => {
    const response = await getIndicateurs.request(
      '/indicateurs?recherche=zzzzznoresult',
    )
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(0)
    expect(body.total).toBe(0)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.pagination.cursor).toBeNull()
  })
})

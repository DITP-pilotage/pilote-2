// Route module imported first so @hono/zod-openapi extends Zod's prototype
// before any mb-shared schemas are evaluated. Once mb-shared switches to
// schema factories (no module-level z.object() calls), this can be relaxed.
import { ErrorApiModelSchema, indicateurRoutes } from '@/indicateur/routes'
import { OpenAPIHono } from '@hono/zod-openapi'
import {
  createPaginatedApiListSchema,
  indicateurApiModelSchema,
} from '@pilote/mb-shared/api'
import { describe, expect, it } from 'vitest'

import { registerErrorHandler } from '@/framework/errors/errorHandler'

const testApp = new OpenAPIHono()
testApp.route('/', indicateurRoutes)
registerErrorHandler(testApp)

const indicateurListApiModelSchema = createPaginatedApiListSchema(indicateurApiModelSchema)

describe('GET /indicateurs', () => {
  it('retourne la première page sans filtre (5 items, hasMore=true)', async () => {
    const response = await testApp.request('/indicateurs')
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(5)
    expect(body.items[0]?.id).toBe(1)
    expect(body.pagination.hasMore).toBe(true)
    expect(body.pagination.cursor).toBe('5')
    expect(body.total).toBe(8)
  })

  it('paginate end-to-end : suit le cursor jusqu\'à hasMore=false', async () => {
    const r1 = await testApp.request('/indicateurs')
    const b1 = indicateurListApiModelSchema.parse(await r1.json())
    expect(b1.pagination.hasMore).toBe(true)

    const r2 = await testApp.request(
      `/indicateurs?cursor=${b1.pagination.cursor}`,
    )
    const b2 = indicateurListApiModelSchema.parse(await r2.json())
    expect(b2.items).toHaveLength(3)
    expect(b2.pagination.hasMore).toBe(false)
    expect(b2.pagination.cursor).toBeNull()
    expect(b2.total).toBe(8)
  })

  it('cursor au-delà du dernier id retourne une page vide', async () => {
    const response = await testApp.request('/indicateurs?cursor=9999')
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(0)
    expect(body.pagination.hasMore).toBe(false)
    expect(body.pagination.cursor).toBeNull()
  })

  it('cursor invalide (non numérique) retourne 400', async () => {
    const response = await testApp.request('/indicateurs?cursor=abc')
    expect(response.status).toBe(400)
  })

  it('filtre par statut', async () => {
    const response = await testApp.request('/indicateurs?statut=archive')
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]?.statut).toBe('archive')
    expect(body.total).toBe(1)
  })

  it('filtre par recherche (nom, case-insensitive)', async () => {
    const response = await testApp.request('/indicateurs?recherche=fibre')
    const body = indicateurListApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]?.nom).toContain('fibre')
  })

  it('retourne une liste vide quand aucune correspondance', async () => {
    const response = await testApp.request(
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

describe('GET /indicateurs/:id', () => {
  it('retourne un indicateur par id', async () => {
    const response = await testApp.request('/indicateurs/1')
    const body = indicateurApiModelSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(body.id).toBe(1)
    expect(body.nom).toBe('Taux de chômage')
  })

  it("retourne 404 ENTITY_NOT_FOUND si l'indicateur n'existe pas", async () => {
    const response = await testApp.request('/indicateurs/9999')
    const body = ErrorApiModelSchema.parse(await response.json())

    expect(response.status).toBe(404)
    expect(body.code).toBe('ENTITY_NOT_FOUND')
    expect(body.message).toBe('Indicateur introuvable')
  })

  it('retourne 400 si l\'id n\'est pas un nombre', async () => {
    const response = await testApp.request('/indicateurs/abc')
    expect(response.status).toBe(400)
  })
})

import { describe, expect, it } from 'vitest'

import { app } from '../app'

describe('routes permissions — câblage OpenAPI', () => {
  it('déclare les routes permissions dans le doc OpenAPI', async () => {
    const res = await app.request('/openapi.json')
    expect(res.status).toBe(200)
    const doc = (await res.json()) as { paths: Record<string, Record<string, unknown>> }

    const attendu: Array<[string, string]> = [
      ['/permissions', 'get'],
      ['/permissions', 'put'],
      ['/permissions/indicateur', 'post'],
      ['/permissions/indicateur', 'delete'],
      ['/permissions/collection', 'post'],
      ['/permissions/collection', 'delete'],
    ]

    for (const [path, method] of attendu) {
      expect(doc.paths[path], `path ${path} manquant`).toBeDefined()
      expect(doc.paths[path]?.[method], `${method.toUpperCase()} ${path} manquant`).toBeDefined()
    }
  })

  it('renvoie 401 sur une lecture non authentifiée', async () => {
    const res = await app.request('/permissions?principalId=00000000-0000-0000-0000-0000000000ff')
    expect(res.status).toBe(401)
  })
})

import { describe, expect, it } from 'vitest'

import { app } from '../app'

// Les routes d'écriture ouvrent leur propre transaction (`withTransaction`), qui
// ne voit pas les fixtures de la transaction de test : leur comportement est
// couvert par les tests de commande. Ici on vérifie le câblage.
describe('routes collection — câblage', () => {
  it('déclare les routes d’écriture dans le doc OpenAPI', async () => {
    const response = await app.request('/openapi.json')

    expect(response.status).toBe(200)
    const doc = (await response.json()) as { paths: Record<string, Record<string, unknown>> }
    expect(doc.paths['/collections']?.post).toBeDefined()
  })

  it('renvoie 401 sur une création non authentifiée', async () => {
    const response = await app.request('/collections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nom: 'X', description: null, visibilite: 'PUBLIC' }),
    })

    expect(response.status).toBe(401)
  })
})

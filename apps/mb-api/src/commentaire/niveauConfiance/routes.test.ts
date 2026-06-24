import { describe, expect, it } from 'vitest'

import { app } from '../../app'

// Tests de câblage OpenAPI / middleware (sans DB ni auth).
describe('routes niveau de confiance — câblage OpenAPI', () => {
  it('déclare les routes niveau de confiance dans le doc OpenAPI', async () => {
    const res = await app.request('/openapi.json')
    expect(res.status).toBe(200)
    const doc = (await res.json()) as { paths: Record<string, Record<string, unknown>> }

    const attendu: Array<[string, string]> = [
      ['/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance', 'post'],
      ['/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance', 'get'],
      ['/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance/historique', 'get'],
      ['/paniers/{panierId}/individus/{individuId}/niveau-confiance', 'post'],
      ['/paniers/{panierId}/individus/{individuId}/niveau-confiance/historique', 'get'],
      ['/paniers/{panierId}/niveau-confiance', 'post'],
      ['/paniers/{panierId}/niveau-confiance', 'get'],
      ['/paniers/{panierId}/niveau-confiance/historique', 'get'],
      ['/niveau-confiance/{commentaireId}', 'put'],
    ]

    for (const [path, method] of attendu) {
      expect(doc.paths[path], `path ${path} manquant`).toBeDefined()
      expect(doc.paths[path]?.[method], `${method.toUpperCase()} ${path} manquant`).toBeDefined()
    }
  })

  it('renvoie 401 sur une création non authentifiée', async () => {
    const res = await app.request('/indicateurs/IND-1/individus/REG-1/niveau-confiance', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ indice: 'OBJECTIF_SECURISE', contenu: '', statut: 'BROUILLON' }),
    })
    expect(res.status).toBe(401)
  })
})

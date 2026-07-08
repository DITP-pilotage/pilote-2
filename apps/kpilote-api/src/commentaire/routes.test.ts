import { describe, expect, it } from 'vitest'

import { app } from '../app'

// Tests de câblage OpenAPI / middleware (sans DB ni auth).
// Le comportement métier (permissions, brouillon, filtrage type, auteur) est couvert
// par les tests d'intégration command/query (modèle transactionnel à rollback).
describe('routes commentaires — câblage OpenAPI', () => {
  it('déclare les 6 routes commentaires dans le doc OpenAPI', async () => {
    const res = await app.request('/openapi.json')
    expect(res.status).toBe(200)
    const doc = (await res.json()) as { paths: Record<string, Record<string, unknown>> }

    const attendu: Array<[string, string]> = [
      ['/indicateurs/{indicateurId}/individus/{individuId}/commentaires', 'post'],
      ['/indicateurs/{indicateurId}/individus/{individuId}/commentaires', 'get'],
      ['/dossiers/{dossierId}/commentaires', 'post'],
      ['/dossiers/{dossierId}/commentaires', 'get'],
      ['/commentaires/{commentaireId}', 'put'],
      ['/commentaires/{commentaireId}', 'delete'],
    ]

    for (const [path, method] of attendu) {
      expect(doc.paths[path], `path ${path} manquant`).toBeDefined()
      expect(doc.paths[path]?.[method], `${method.toUpperCase()} ${path} manquant`).toBeDefined()
    }
  })

  it('renvoie 401 sur une création non authentifiée', async () => {
    const res = await app.request('/indicateurs/IND-1/individus/REG-1/commentaires', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'DEFAUT', contenu: '', statut: 'BROUILLON' }),
    })
    expect(res.status).toBe(401)
  })
})

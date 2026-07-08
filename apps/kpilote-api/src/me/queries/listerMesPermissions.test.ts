import { describe, expect, it } from 'vitest'

import { listerMesPermissions } from '@/me/queries/listerMesPermissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testPanierId } from '@/test/randomIds'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerMesPermissions', () => {
  it(
    'renvoie des listes vides quand le principal n’a aucune permission',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({ paniers: [], indicateurs: [] })
    }),
  )

  it(
    'renvoie isAdmin: true et des listes vides pour une API key ADMIN',
    integrationTest(async () => {
      const panierId = testPanierId()
      const [indicateurId] = testIndicateurIds(1)
      // On crée des permissions explicites pour vérifier qu'elles sont quand même
      // ignorées (le client doit s'appuyer uniquement sur isAdmin).
      await fixtures.panier({ publicId: panierId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panierId }, action: 'WRITE' }],
      })

      const result = await runAsAdmin(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({
        isAdmin: true,
        paniers: [],
        indicateurs: [],
      })
    }),
  )

  it(
    'inclut les permissions directes sur les paniers et les indicateurs',
    integrationTest(async () => {
      const panierId = testPanierId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.panier({ publicId: panierId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panierId }, action: 'READ' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({
        paniers: [{ id: panierId, actions: ['READ'] }],
        indicateurs: [{ id: indicateurId, actions: ['WRITE'] }],
      })
    }),
  )

  it(
    'fusionne READ et WRITE directs sur la même ressource en une seule entrée triée READ avant WRITE',
    integrationTest(async () => {
      const panierId = testPanierId()
      await fixtures.panier({ publicId: panierId })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [
          { panier: { publicId: panierId }, action: 'WRITE' },
          { panier: { publicId: panierId }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap().paniers).toEqual([{ id: panierId, actions: ['READ', 'WRITE'] }])
    }),
  )

  it(
    'propage READ panier → READ sur tous ses indicateurs (depuis READ ou WRITE panier)',
    integrationTest(async () => {
      const panierWriteId = testPanierId()
      const panierReadId = testPanierId()
      const [indWrite1, indWrite2, indRead] = testIndicateurIds(3)
      await fixtures.panier(
        {
          publicId: panierWriteId,
          indicateurs: [{ publicId: indWrite1 }, { publicId: indWrite2 }],
        },
        { publicId: panierReadId, indicateurs: [{ publicId: indRead }] },
      )
      const apiKey = await fixtures.apiKey({
        panierPermissions: [
          { panier: { publicId: panierWriteId }, action: 'WRITE' },
          { panier: { publicId: panierReadId }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      // Les 3 indicateurs liés sont propagés en READ. WRITE panier ne propage jamais WRITE.
      const indicateurs = result._unsafeUnwrap().indicateurs
      expect(indicateurs).toEqual(
        [
          { id: indWrite1, actions: ['READ'] },
          { id: indWrite2, actions: ['READ'] },
          { id: indRead, actions: ['READ'] },
        ].sort((a, b) => a.id.localeCompare(b.id)),
      )
    }),
  )

  it(
    'fusionne une permission directe et la propagation panier en une seule entrée dédupliquée',
    integrationTest(async () => {
      const panierId = testPanierId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.panier({ publicId: panierId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panierId }, action: 'WRITE' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      // READ direct + READ propagé via panierWrite → une seule entrée, pas de doublon.
      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, actions: ['READ'] }])
    }),
  )

  it(
    'combine WRITE direct sur indicateur et READ propagé en une entrée triée READ avant WRITE',
    integrationTest(async () => {
      const panierId = testPanierId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.panier({ publicId: panierId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panierId }, action: 'READ' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        { id: indicateurId, actions: ['READ', 'WRITE'] },
      ])
    }),
  )

  it(
    'trie paniers et indicateurs par id ASC indépendamment de l’ordre de création',
    integrationTest(async () => {
      const indicateurs = testIndicateurIds(3) // tuple trié ASC
      const paniers = [testPanierId(), testPanierId(), testPanierId()].sort()
      await fixtures.panier(
        { publicId: paniers[2]! },
        { publicId: paniers[0]! },
        { publicId: paniers[1]! },
      )
      await fixtures.indicateur(
        { publicId: indicateurs[2] },
        { publicId: indicateurs[0] },
        { publicId: indicateurs[1] },
      )
      const apiKey = await fixtures.apiKey({
        panierPermissions: [
          { panier: { publicId: paniers[2]! }, action: 'READ' },
          { panier: { publicId: paniers[0]! }, action: 'READ' },
          { panier: { publicId: paniers[1]! }, action: 'READ' },
        ],
        permissions: [
          { indicateur: { publicId: indicateurs[2] }, action: 'WRITE' },
          { indicateur: { publicId: indicateurs[0] }, action: 'WRITE' },
          { indicateur: { publicId: indicateurs[1] }, action: 'WRITE' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      const value = result._unsafeUnwrap()
      expect(value.paniers.map((p) => p.id)).toEqual(paniers)
      expect(value.indicateurs.map((i) => i.id)).toEqual(indicateurs)
    }),
  )
})

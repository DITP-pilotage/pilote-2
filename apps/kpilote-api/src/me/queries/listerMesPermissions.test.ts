import { describe, expect, it } from 'vitest'

import { listerMesPermissions } from '@/me/queries/listerMesPermissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testDossierId } from '@/test/randomIds'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerMesPermissions', () => {
  it(
    'renvoie des listes vides quand le principal n’a aucune permission',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({ dossiers: [], indicateurs: [] })
    }),
  )

  it(
    'renvoie isAdmin: true et des listes vides pour une API key ADMIN',
    integrationTest(async () => {
      const dossierId = testDossierId()
      const [indicateurId] = testIndicateurIds(1)
      // On crée des permissions explicites pour vérifier qu'elles sont quand même
      // ignorées (le client doit s'appuyer uniquement sur isAdmin).
      await fixtures.dossier({ publicId: dossierId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: dossierId }, action: 'WRITE' }],
      })

      const result = await runAsAdmin(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({
        isAdmin: true,
        dossiers: [],
        indicateurs: [],
      })
    }),
  )

  it(
    'inclut les permissions directes sur les dossiers et les indicateurs',
    integrationTest(async () => {
      const dossierId = testDossierId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.dossier({ publicId: dossierId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: dossierId }, action: 'READ' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap()).toEqual({
        dossiers: [{ id: dossierId, actions: ['READ'] }],
        indicateurs: [{ id: indicateurId, actions: ['WRITE'] }],
      })
    }),
  )

  it(
    'fusionne READ et WRITE directs sur la même ressource en une seule entrée triée READ avant WRITE',
    integrationTest(async () => {
      const dossierId = testDossierId()
      await fixtures.dossier({ publicId: dossierId })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [
          { dossier: { publicId: dossierId }, action: 'WRITE' },
          { dossier: { publicId: dossierId }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap().dossiers).toEqual([{ id: dossierId, actions: ['READ', 'WRITE'] }])
    }),
  )

  it(
    'propage READ dossier → READ sur tous ses indicateurs (depuis READ ou WRITE dossier)',
    integrationTest(async () => {
      const dossierWriteId = testDossierId()
      const dossierReadId = testDossierId()
      const [indWrite1, indWrite2, indRead] = testIndicateurIds(3)
      await fixtures.dossier(
        {
          publicId: dossierWriteId,
          indicateurs: [{ publicId: indWrite1 }, { publicId: indWrite2 }],
        },
        { publicId: dossierReadId, indicateurs: [{ publicId: indRead }] },
      )
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [
          { dossier: { publicId: dossierWriteId }, action: 'WRITE' },
          { dossier: { publicId: dossierReadId }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      // Les 3 indicateurs liés sont propagés en READ. WRITE dossier ne propage jamais WRITE.
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
    'fusionne une permission directe et la propagation dossier en une seule entrée dédupliquée',
    integrationTest(async () => {
      const dossierId = testDossierId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.dossier({ publicId: dossierId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: dossierId }, action: 'WRITE' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      // READ direct + READ propagé via dossierWrite → une seule entrée, pas de doublon.
      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, actions: ['READ'] }])
    }),
  )

  it(
    'combine WRITE direct sur indicateur et READ propagé en une entrée triée READ avant WRITE',
    integrationTest(async () => {
      const dossierId = testDossierId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.dossier({ publicId: dossierId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: dossierId }, action: 'READ' }],
        permissions: [{ indicateur: { publicId: indicateurId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        { id: indicateurId, actions: ['READ', 'WRITE'] },
      ])
    }),
  )

  it(
    "trie dossiers et indicateurs par id ASC indépendamment de l’ordre de création",
    integrationTest(async () => {
      const indicateurs = testIndicateurIds(3) // tuple trié ASC
      const dossiers = [testDossierId(), testDossierId(), testDossierId()].sort()
      await fixtures.dossier(
        { publicId: dossiers[2]! },
        { publicId: dossiers[0]! },
        { publicId: dossiers[1]! },
      )
      await fixtures.indicateur(
        { publicId: indicateurs[2] },
        { publicId: indicateurs[0] },
        { publicId: indicateurs[1] },
      )
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [
          { dossier: { publicId: dossiers[2]! }, action: 'READ' },
          { dossier: { publicId: dossiers[0]! }, action: 'READ' },
          { dossier: { publicId: dossiers[1]! }, action: 'READ' },
        ],
        permissions: [
          { indicateur: { publicId: indicateurs[2] }, action: 'WRITE' },
          { indicateur: { publicId: indicateurs[0] }, action: 'WRITE' },
          { indicateur: { publicId: indicateurs[1] }, action: 'WRITE' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listerMesPermissions())

      const value = result._unsafeUnwrap()
      expect(value.dossiers.map((p) => p.id)).toEqual(dossiers)
      expect(value.indicateurs.map((i) => i.id)).toEqual(indicateurs)
    }),
  )
})

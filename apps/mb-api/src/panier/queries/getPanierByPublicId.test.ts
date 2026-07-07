import { describe, expect, it } from 'vitest'

import { getPanierByPublicId } from '@/panier/queries/getPanierByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testPanierId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getPanierByPublicId', () => {
  it(
    "retourne le panier PUBLIC avec ses indicateurs triés par ordre d'insertion",
    integrationTest(async () => {
      const [indA, indB] = testIndicateurIds(2)
      const panDetail = testPanierId()
      const panier = await fixtures.panier({
        publicId: panDetail,
        nom: 'Panier de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panDetail))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: panDetail,
        nom: 'Panier de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurIds: [indA, indB],
        responsables: [],
        createdAt: panier.createdAt.toISOString(),
        updatedAt: panier.updatedAt.toISOString(),
      })
    }),
  )

  it(
    'retourne un panier sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      const panEmpty = testPanierId()
      await fixtures.panier({
        publicId: panEmpty,
        nom: 'Sans indicateurs',
        visibilite: 'PUBLIC',
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panEmpty))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: panEmpty,
        indicateurIds: [],
        description: null,
      })
    }),
  )

  it(
    "retourne un panier PRIVE quand le principal dispose d'une permission",
    integrationTest(async () => {
      const panPriv = testPanierId()
      await fixtures.panier({ publicId: panPriv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panPriv }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panPriv))

      expect(result._unsafeUnwrap().id).toBe(panPriv)
    }),
  )

  it(
    'lève une erreur quand un panier PRIVE est demandé sans permission',
    integrationTest(async () => {
      const panNoacl = testPanierId()
      await fixtures.panier({ publicId: panNoacl, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(runAsPrincipal(apiKey.id, () => getPanierByPublicId(panNoacl))).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur quand aucun panier ne correspond',
    integrationTest(async () => {
      const panNope = testPanierId()
      const apiKey = await fixtures.apiKey()

      await expect(runAsPrincipal(apiKey.id, () => getPanierByPublicId(panNope))).rejects.toThrow()
    }),
  )

  it(
    "retourne les responsables du panier triés par ordre d'assignation",
    integrationTest(async () => {
      const panId = testPanierId()
      await fixtures.panierResponsable({
        panier: { publicId: panId, visibilite: 'PUBLIC' },
        utilisateur: {
          email: `resp-a-${panId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panId))

      expect(result._unsafeUnwrap().responsables).toEqual([
        {
          email: `resp-a-${panId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      ])
    }),
  )

  it(
    'retourne les responsables dans le bon ordre (createdAt ASC) quand plusieurs sont assignés',
    integrationTest(async () => {
      const panOrd = testPanierId()
      // Insertions séquentielles pour garantir des createdAt distincts.
      await fixtures.panierResponsable({
        panier: { publicId: panOrd, visibilite: 'PUBLIC' },
        utilisateur: { email: `aa-ord-${panOrd}@example.com` },
      })
      await fixtures.panierResponsable({
        panier: { publicId: panOrd },
        utilisateur: { email: `bb-ord-${panOrd}@example.com` },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panOrd))
      const emails = result._unsafeUnwrap().responsables.map((r) => r.email)

      expect(emails).toEqual([`aa-ord-${panOrd}@example.com`, `bb-ord-${panOrd}@example.com`])
    }),
  )
})

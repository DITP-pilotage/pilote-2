import { describe, expect, it } from 'vitest'

import { getPanierResponsables } from '@/panier/queries/getPanierResponsables'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testPanierId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getPanierResponsables', () => {
  it(
    "retourne une liste vide quand le panier PUBLIC n'a aucun responsable",
    integrationTest(async () => {
      const panVide = testPanierId()
      await fixtures.panier({ publicId: panVide, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierResponsables(panVide))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    "retourne les champs complets d'un responsable avec profil renseigné",
    integrationTest(async () => {
      const panComplet = testPanierId()
      await fixtures.panierResponsable({
        panier: { publicId: panComplet, visibilite: 'PUBLIC' },
        utilisateur: {
          email: `alice-${panComplet}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierResponsables(panComplet))

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            email: `alice-${panComplet}@example.com`,
            nom: 'Martin',
            prenom: 'Alice',
            service: 'DITP',
            fonction: 'Chargée de mission',
          },
        ],
      })
    }),
  )

  it(
    "retourne les responsables triés par ordre d'assignation (createdAt ASC)",
    integrationTest(async () => {
      const panOrdre = testPanierId()
      const panierRow = await fixtures.panier({ publicId: panOrdre, visibilite: 'PUBLIC' })
      const userA = await fixtures.utilisateur({ email: `aa-${panOrdre}@example.com` })
      const userB = await fixtures.utilisateur({ email: `bb-${panOrdre}@example.com` })
      // Insertion séquentielle pour garantir un createdAt différent.
      await fixtures.panierResponsable({
        panier: { publicId: panierRow.publicId },
        utilisateur: { email: userA.email },
      })
      await fixtures.panierResponsable({
        panier: { publicId: panierRow.publicId },
        utilisateur: { email: userB.email },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierResponsables(panOrdre))
      const emails = result._unsafeUnwrap().items.map((r) => r.email)

      expect(emails).toEqual([userA.email, userB.email])
    }),
  )

  it(
    'est accessible sur un panier PRIVE avec permission READ',
    integrationTest(async () => {
      const panPrive = testPanierId()
      await fixtures.panierResponsable({
        panier: { publicId: panPrive, visibilite: 'PRIVE' },
        utilisateur: { email: `resp-${panPrive}@example.com` },
      })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panPrive }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getPanierResponsables(panPrive))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().items).toHaveLength(1)
    }),
  )

  it(
    'lève une erreur sur un panier PRIVE sans permission',
    integrationTest(async () => {
      const panPriveSans = testPanierId()
      await fixtures.panier({ publicId: panPriveSans, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getPanierResponsables(panPriveSans)),
      ).rejects.toThrow()
    }),
  )

  it(
    "lève une erreur si le panier n'existe pas",
    integrationTest(async () => {
      const panInexistant = testPanierId()
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getPanierResponsables(panInexistant)),
      ).rejects.toThrow()
    }),
  )
})

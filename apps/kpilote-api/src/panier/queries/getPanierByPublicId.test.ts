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
        contactsUtiles: [],
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
      const liaison = await fixtures.panierResponsable({
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
          id: liaison.utilisateurId,
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

  it(
    "retourne tous les champs d'un contact utile groupé par organisme",
    integrationTest(async () => {
      const panContact = testPanierId()
      await fixtures.panierContactUtile({
        panier: { publicId: panContact, visibilite: 'PUBLIC' },
        contactUtile: {
          nom: 'Contact complet',
          description: 'Une description',
          telephone: '01 23 45 67 89',
          email: 'contact@example.com',
          url: 'https://example.com',
          adresse: '1 rue de la Paix, 75001 Paris',
          organisme: { nom: 'Organisme A' },
        },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panContact))
      const [group] = result._unsafeUnwrap().contactsUtiles

      expect(group?.organisme.nom).toBe('Organisme A')
      expect(group?.contacts[0]).toMatchObject({
        nom: 'Contact complet',
        description: 'Une description',
        telephone: '01 23 45 67 89',
        email: 'contact@example.com',
        url: 'https://example.com',
        adresse: '1 rue de la Paix, 75001 Paris',
      })
    }),
  )

  it(
    "retourne null pour les champs absents d'un contact utile minimal",
    integrationTest(async () => {
      const panMinimal = testPanierId()
      await fixtures.panierContactUtile({
        panier: { publicId: panMinimal, visibilite: 'PUBLIC' },
        contactUtile: { nom: 'Contact minimal' },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panMinimal))
      const contact = result._unsafeUnwrap().contactsUtiles[0]!.contacts[0]!

      expect(contact).toMatchObject({
        nom: 'Contact minimal',
        description: null,
        telephone: null,
        email: null,
        url: null,
        adresse: null,
      })
    }),
  )

  it(
    'regroupe les contacts par organisme et trie organismes puis contacts par nom',
    integrationTest(async () => {
      const panTri = testPanierId()
      await fixtures.panier({ publicId: panTri, visibilite: 'PUBLIC' })
      const orgZ = await fixtures.organisme({ nom: 'Zzz Organisation' })
      const orgA = await fixtures.organisme({ nom: 'Aaa Organisation' })
      const cZebra = await fixtures.contactUtile({
        nom: 'Zebra',
        organisme: { id: orgA.id, nom: orgA.nom },
      })
      const cAlpha = await fixtures.contactUtile({
        nom: 'Alpha',
        organisme: { id: orgA.id, nom: orgA.nom },
      })
      const cZeta = await fixtures.contactUtile({
        nom: 'Zeta',
        organisme: { id: orgZ.id, nom: orgZ.nom },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panTri },
        contactUtile: { id: cZebra.id },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panTri },
        contactUtile: { id: cAlpha.id },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panTri },
        contactUtile: { id: cZeta.id },
      })
      const apiKey = await fixtures.apiKey()

      const groups = (
        await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panTri))
      )._unsafeUnwrap().contactsUtiles

      expect(groups.map((g) => g.organisme.nom)).toEqual(['Aaa Organisation', 'Zzz Organisation'])
      expect(groups[0]!.contacts.map((c) => c.nom)).toEqual(['Alpha', 'Zebra'])
      expect(groups[1]!.contacts.map((c) => c.nom)).toEqual(['Zeta'])
    }),
  )
})

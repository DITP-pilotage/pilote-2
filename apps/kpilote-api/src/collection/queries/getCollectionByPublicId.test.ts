import { describe, expect, it } from 'vitest'

import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testCollectionId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getCollectionByPublicId', () => {
  it(
    "retourne la collection PUBLIC avec ses indicateurs triés par ordre d'insertion",
    integrationTest(async () => {
      const [indA, indB] = testIndicateurIds(2)
      const panDetail = testCollectionId()
      const collection = await fixtures.collection({
        publicId: panDetail,
        nom: 'Collection de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(panDetail))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: panDetail,
        nom: 'Collection de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurs: [
          { id: indA, ponderation: 1 },
          { id: indB, ponderation: 1 },
        ],
        responsables: [],
        contactsUtiles: [],
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      })
    }),
  )

  it(
    'retourne une collection sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      const dosEmpty = testCollectionId()
      await fixtures.collection({
        publicId: dosEmpty,
        nom: 'Sans indicateurs',
        visibilite: 'PUBLIC',
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(dosEmpty))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: dosEmpty,
        indicateurs: [],
        description: null,
      })
    }),
  )

  it(
    "retourne une collection PRIVE quand le principal dispose d'une permission",
    integrationTest(async () => {
      const panPriv = testCollectionId()
      await fixtures.collection({ publicId: panPriv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panPriv }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(panPriv))

      expect(result._unsafeUnwrap().id).toBe(panPriv)
    }),
  )

  it(
    'lève une erreur quand une collection PRIVE est demandé sans permission',
    integrationTest(async () => {
      const panNoacl = testCollectionId()
      await fixtures.collection({ publicId: panNoacl, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getCollectionByPublicId(panNoacl)),
      ).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur quand aucune collection ne correspond',
    integrationTest(async () => {
      const panNope = testCollectionId()
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getCollectionByPublicId(panNope)),
      ).rejects.toThrow()
    }),
  )

  it(
    "retourne les responsables de la collection triés par ordre d'assignation",
    integrationTest(async () => {
      const dosId = testCollectionId()
      const liaison = await fixtures.collectionResponsable({
        collection: { publicId: dosId, visibilite: 'PUBLIC' },
        utilisateur: {
          email: `resp-a-${dosId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(dosId))

      expect(result._unsafeUnwrap().responsables).toEqual([
        {
          id: liaison.utilisateurId,
          email: `resp-a-${dosId}@example.com`,
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
      const dosOrd = testCollectionId()
      // Insertions séquentielles pour garantir des createdAt distincts.
      await fixtures.collectionResponsable({
        collection: { publicId: dosOrd, visibilite: 'PUBLIC' },
        utilisateur: { email: `aa-ord-${dosOrd}@example.com` },
      })
      await fixtures.collectionResponsable({
        collection: { publicId: dosOrd },
        utilisateur: { email: `bb-ord-${dosOrd}@example.com` },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(dosOrd))
      const emails = result._unsafeUnwrap().responsables.map((r) => r.email)

      expect(emails).toEqual([`aa-ord-${dosOrd}@example.com`, `bb-ord-${dosOrd}@example.com`])
    }),
  )

  it(
    "retourne tous les champs d'un contact utile groupé par organisme",
    integrationTest(async () => {
      const panContact = testCollectionId()
      await fixtures.collectionContactUtile({
        collection: { publicId: panContact, visibilite: 'PUBLIC' },
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

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(panContact))
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
      const panMinimal = testCollectionId()
      await fixtures.collectionContactUtile({
        collection: { publicId: panMinimal, visibilite: 'PUBLIC' },
        contactUtile: { nom: 'Contact minimal' },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(panMinimal))
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
      const dosTri = testCollectionId()
      await fixtures.collection({ publicId: dosTri, visibilite: 'PUBLIC' })
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
      await fixtures.collectionContactUtile({
        collection: { publicId: dosTri },
        contactUtile: { id: cZebra.id },
      })
      await fixtures.collectionContactUtile({
        collection: { publicId: dosTri },
        contactUtile: { id: cAlpha.id },
      })
      await fixtures.collectionContactUtile({
        collection: { publicId: dosTri },
        contactUtile: { id: cZeta.id },
      })
      const apiKey = await fixtures.apiKey()

      const groups = (
        await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(dosTri))
      )._unsafeUnwrap().contactsUtiles

      expect(groups.map((g) => g.organisme.nom)).toEqual(['Aaa Organisation', 'Zzz Organisation'])
      expect(groups[0]!.contacts.map((c) => c.nom)).toEqual(['Alpha', 'Zebra'])
      expect(groups[1]!.contacts.map((c) => c.nom)).toEqual(['Zeta'])
    }),
  )
})

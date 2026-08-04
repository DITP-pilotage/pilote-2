import { CollectionPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testCollectionId } from '@/test/randomIds'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getCollectionByPublicId', () => {
  it(
    "retourne la collection PUBLIC avec ses indicateurs triés par ordre d'insertion",
    integrationTest(async () => {
      const [indA, indB] = testIndicateurIds(2)
      const colDetail = testCollectionId()
      const collection = await fixtures.collection({
        publicId: colDetail,
        nom: 'Collection de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colDetail))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: colDetail,
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
      const colEmpty = testCollectionId()
      await fixtures.collection({
        publicId: colEmpty,
        nom: 'Sans indicateurs',
        visibilite: 'PUBLIC',
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colEmpty))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: colEmpty,
        indicateurs: [],
        description: null,
      })
    }),
  )

  it(
    "retourne une collection PRIVE quand le principal dispose d'une permission",
    integrationTest(async () => {
      const colPriv = testCollectionId()
      await fixtures.collection({ publicId: colPriv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colPriv }, action: CollectionPermissionAction.READ },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colPriv))

      expect(result._unsafeUnwrap().id).toBe(colPriv)
    }),
  )

  it(
    'retourne une collection PRIVE à une clé ADMIN sans permission directe',
    integrationTest(async () => {
      const colPrive = testCollectionId()
      await fixtures.collection({
        publicId: colPrive,
        nom: 'Collection privée',
        visibilite: 'PRIVE',
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () => getCollectionByPublicId(colPrive))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toMatchObject({ id: colPrive, visibilite: 'PRIVE' })
    }),
  )

  it(
    'lève une erreur quand une collection PRIVE est demandé sans permission',
    integrationTest(async () => {
      const colNoacl = testCollectionId()
      await fixtures.collection({ publicId: colNoacl, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colNoacl)),
      ).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur quand aucune collection ne correspond',
    integrationTest(async () => {
      const colNope = testCollectionId()
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colNope)),
      ).rejects.toThrow()
    }),
  )

  it(
    "retourne les responsables de la collection triés par ordre d'assignation",
    integrationTest(async () => {
      const colId = testCollectionId()
      const liaison = await fixtures.collectionResponsable({
        collection: { publicId: colId, visibilite: 'PUBLIC' },
        utilisateur: {
          email: `resp-a-${colId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colId))

      expect(result._unsafeUnwrap().responsables).toEqual([
        {
          id: liaison.utilisateurId,
          email: `resp-a-${colId}@example.com`,
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
      const colOrd = testCollectionId()
      // Insertions séquentielles pour garantir des createdAt distincts.
      await fixtures.collectionResponsable({
        collection: { publicId: colOrd, visibilite: 'PUBLIC' },
        utilisateur: { email: `aa-ord-${colOrd}@example.com` },
      })
      await fixtures.collectionResponsable({
        collection: { publicId: colOrd },
        utilisateur: { email: `bb-ord-${colOrd}@example.com` },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colOrd))
      const emails = result._unsafeUnwrap().responsables.map((r) => r.email)

      expect(emails).toEqual([`aa-ord-${colOrd}@example.com`, `bb-ord-${colOrd}@example.com`])
    }),
  )

  it(
    "retourne tous les champs d'un contact utile groupé par organisme",
    integrationTest(async () => {
      const colContact = testCollectionId()
      await fixtures.collectionContactUtile({
        collection: { publicId: colContact, visibilite: 'PUBLIC' },
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

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colContact))
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
      const colMinimal = testCollectionId()
      await fixtures.collectionContactUtile({
        collection: { publicId: colMinimal, visibilite: 'PUBLIC' },
        contactUtile: { nom: 'Contact minimal' },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colMinimal))
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
      const colTri = testCollectionId()
      await fixtures.collection({ publicId: colTri, visibilite: 'PUBLIC' })
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
        collection: { publicId: colTri },
        contactUtile: { id: cZebra.id },
      })
      await fixtures.collectionContactUtile({
        collection: { publicId: colTri },
        contactUtile: { id: cAlpha.id },
      })
      await fixtures.collectionContactUtile({
        collection: { publicId: colTri },
        contactUtile: { id: cZeta.id },
      })
      const apiKey = await fixtures.apiKey()

      const groups = (
        await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colTri))
      )._unsafeUnwrap().contactsUtiles

      expect(groups.map((g) => g.organisme.nom)).toEqual(['Aaa Organisation', 'Zzz Organisation'])
      expect(groups[0]!.contacts.map((c) => c.nom)).toEqual(['Alpha', 'Zebra'])
      expect(groups[1]!.contacts.map((c) => c.nom)).toEqual(['Zeta'])
    }),
  )
})

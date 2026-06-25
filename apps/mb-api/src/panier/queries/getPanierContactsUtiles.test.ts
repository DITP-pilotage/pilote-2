import { describe, expect, it } from 'vitest'

import { getPanierContactsUtiles } from '@/panier/queries/getPanierContactsUtiles'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testPanierId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getPanierContactsUtiles', () => {
  it(
    'retourne une liste vide quand le panier na aucun contact',
    integrationTest(async () => {
      const panVide = testPanierId()
      await fixtures.panier({ publicId: panVide, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panVide))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'retourne tous les champs dun contact quand ils sont tous renseignés',
    integrationTest(async () => {
      const panComplet = testPanierId()
      await fixtures.panierContactUtile({
        panier: { publicId: panComplet, visibilite: 'PUBLIC' },
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

      const result = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panComplet))
      const item = result._unsafeUnwrap().items[0]

      expect(item).toBeDefined()
      expect(item!.organisme.nom).toBe('Organisme A')
      expect(item!.contacts[0]).toMatchObject({
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
    'retourne null pour les champs absents dun contact minimal',
    integrationTest(async () => {
      const panMinimal = testPanierId()
      await fixtures.panierContactUtile({
        panier: { publicId: panMinimal, visibilite: 'PUBLIC' },
        contactUtile: { nom: 'Contact minimal' },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panMinimal))
      const contact = result._unsafeUnwrap().items[0]!.contacts[0]!

      expect(contact.nom).toBe('Contact minimal')
      expect(contact.description).toBeNull()
      expect(contact.telephone).toBeNull()
      expect(contact.email).toBeNull()
      expect(contact.url).toBeNull()
      expect(contact.adresse).toBeNull()
    }),
  )

  it(
    'regroupe plusieurs contacts du même organisme dans un seul item',
    integrationTest(async () => {
      const panGroupé = testPanierId()
      await fixtures.panier({ publicId: panGroupé, visibilite: 'PUBLIC' })
      const org = await fixtures.organisme({ nom: 'Organisme Unique' })
      const c1 = await fixtures.contactUtile({
        nom: 'Alpha',
        organisme: { id: org.id, nom: org.nom },
      })
      const c2 = await fixtures.contactUtile({
        nom: 'Beta',
        organisme: { id: org.id, nom: org.nom },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panGroupé },
        contactUtile: { id: c1.id },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panGroupé },
        contactUtile: { id: c2.id },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panGroupé))
      const items = result._unsafeUnwrap().items

      expect(items).toHaveLength(1)
      expect(items[0]!.organisme.nom).toBe('Organisme Unique')
      expect(items[0]!.contacts).toHaveLength(2)
    }),
  )

  it(
    'retourne plusieurs organismes triés alphabétiquement',
    integrationTest(async () => {
      const panTri = testPanierId()
      await fixtures.panier({ publicId: panTri, visibilite: 'PUBLIC' })
      const orgZ = await fixtures.organisme({ nom: 'Zzz Organisation' })
      const orgA = await fixtures.organisme({ nom: 'Aaa Organisation' })
      const cZ = await fixtures.contactUtile({
        nom: 'Contact Z',
        organisme: { id: orgZ.id, nom: orgZ.nom },
      })
      const cA = await fixtures.contactUtile({
        nom: 'Contact A',
        organisme: { id: orgA.id, nom: orgA.nom },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panTri },
        contactUtile: { id: cZ.id },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panTri },
        contactUtile: { id: cA.id },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panTri))
      const noms = result._unsafeUnwrap().items.map((i) => i.organisme.nom)

      expect(noms).toEqual(['Aaa Organisation', 'Zzz Organisation'])
    }),
  )

  it(
    'trie les contacts dun organisme alphabétiquement par nom',
    integrationTest(async () => {
      const panContactsTri = testPanierId()
      await fixtures.panier({ publicId: panContactsTri, visibilite: 'PUBLIC' })
      const org = await fixtures.organisme({ nom: 'Organisme Tri' })
      const cZ = await fixtures.contactUtile({
        nom: 'Zebra',
        organisme: { id: org.id, nom: org.nom },
      })
      const cA = await fixtures.contactUtile({
        nom: 'Alpha',
        organisme: { id: org.id, nom: org.nom },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panContactsTri },
        contactUtile: { id: cZ.id },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: panContactsTri },
        contactUtile: { id: cA.id },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panContactsTri))
      const nomsContacts = result._unsafeUnwrap().items[0]!.contacts.map((c) => c.nom)

      expect(nomsContacts).toEqual(['Alpha', 'Zebra'])
    }),
  )

  it(
    'est accessible sur un panier PRIVE avec permission READ',
    integrationTest(async () => {
      const panPrive = testPanierId()
      await fixtures.panierContactUtile({
        panier: { publicId: panPrive, visibilite: 'PRIVE' },
        contactUtile: { nom: 'Contact privé' },
      })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panPrive }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panPrive))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().items[0]!.contacts).toHaveLength(1)
    }),
  )

  it(
    'lève une erreur sur un panier PRIVE sans permission',
    integrationTest(async () => {
      const panPriveSans = testPanierId()
      await fixtures.panier({ publicId: panPriveSans, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panPriveSans)),
      ).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur si le panier nexiste pas',
    integrationTest(async () => {
      const panInexistant = testPanierId()
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(panInexistant)),
      ).rejects.toThrow()
    }),
  )

  it(
    'un contact rattaché à deux paniers est visible dans chacun indépendamment',
    integrationTest(async () => {
      const pan1 = testPanierId()
      const pan2 = testPanierId()
      await fixtures.panier({ publicId: pan1, visibilite: 'PUBLIC' })
      await fixtures.panier({ publicId: pan2, visibilite: 'PUBLIC' })
      const org = await fixtures.organisme({ nom: 'Organisme Partagé' })
      const contact = await fixtures.contactUtile({
        nom: 'Contact Partagé',
        organisme: { id: org.id, nom: org.nom },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: pan1 },
        contactUtile: { id: contact.id },
      })
      await fixtures.panierContactUtile({
        panier: { publicId: pan2 },
        contactUtile: { id: contact.id },
      })
      const apiKey = await fixtures.apiKey()

      const result1 = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(pan1))
      const result2 = await runAsPrincipal(apiKey.id, () => getPanierContactsUtiles(pan2))

      expect(result1._unsafeUnwrap().items[0]!.contacts[0]!.nom).toBe('Contact Partagé')
      expect(result2._unsafeUnwrap().items[0]!.contacts[0]!.nom).toBe('Contact Partagé')
    }),
  )
})

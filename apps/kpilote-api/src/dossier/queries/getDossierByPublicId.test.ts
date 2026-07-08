import { describe, expect, it } from 'vitest'

import { getDossierByPublicId } from '@/dossier/queries/getDossierByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testDossierId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getDossierByPublicId', () => {
  it(
    "retourne le dossier PUBLIC avec ses indicateurs triés par ordre d'insertion",
    integrationTest(async () => {
      const [indA, indB] = testIndicateurIds(2)
      const panDetail = testDossierId()
      const dossier = await fixtures.dossier({
        publicId: panDetail,
        nom: 'Dossier de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getDossierByPublicId(panDetail))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: panDetail,
        nom: 'Dossier de détail',
        description: 'Une description',
        visibilite: 'PUBLIC',
        indicateurIds: [indA, indB],
        responsables: [],
        contactsUtiles: [],
        createdAt: dossier.createdAt.toISOString(),
        updatedAt: dossier.updatedAt.toISOString(),
      })
    }),
  )

  it(
    'retourne un dossier sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      const dosEmpty = testDossierId()
      await fixtures.dossier({
        publicId: dosEmpty,
        nom: 'Sans indicateurs',
        visibilite: 'PUBLIC',
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getDossierByPublicId(dosEmpty))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: dosEmpty,
        indicateurIds: [],
        description: null,
      })
    }),
  )

  it(
    "retourne un dossier PRIVE quand le principal dispose d'une permission",
    integrationTest(async () => {
      const panPriv = testDossierId()
      await fixtures.dossier({ publicId: panPriv, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: panPriv }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getDossierByPublicId(panPriv))

      expect(result._unsafeUnwrap().id).toBe(panPriv)
    }),
  )

  it(
    'lève une erreur quand un dossier PRIVE est demandé sans permission',
    integrationTest(async () => {
      const panNoacl = testDossierId()
      await fixtures.dossier({ publicId: panNoacl, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getDossierByPublicId(panNoacl)),
      ).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur quand aucun dossier ne correspond',
    integrationTest(async () => {
      const panNope = testDossierId()
      const apiKey = await fixtures.apiKey()

      await expect(runAsPrincipal(apiKey.id, () => getDossierByPublicId(panNope))).rejects.toThrow()
    }),
  )

  it(
    "retourne les responsables du dossier triés par ordre d'assignation",
    integrationTest(async () => {
      const dosId = testDossierId()
      const liaison = await fixtures.dossierResponsable({
        dossier: { publicId: dosId, visibilite: 'PUBLIC' },
        utilisateur: {
          email: `resp-a-${dosId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getDossierByPublicId(dosId))

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
      const dosOrd = testDossierId()
      // Insertions séquentielles pour garantir des createdAt distincts.
      await fixtures.dossierResponsable({
        dossier: { publicId: dosOrd, visibilite: 'PUBLIC' },
        utilisateur: { email: `aa-ord-${dosOrd}@example.com` },
      })
      await fixtures.dossierResponsable({
        dossier: { publicId: dosOrd },
        utilisateur: { email: `bb-ord-${dosOrd}@example.com` },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getDossierByPublicId(dosOrd))
      const emails = result._unsafeUnwrap().responsables.map((r) => r.email)

      expect(emails).toEqual([`aa-ord-${dosOrd}@example.com`, `bb-ord-${dosOrd}@example.com`])
    }),
  )

  it(
    "retourne tous les champs d'un contact utile groupé par organisme",
    integrationTest(async () => {
      const panContact = testDossierId()
      await fixtures.dossierContactUtile({
        dossier: { publicId: panContact, visibilite: 'PUBLIC' },
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

      const result = await runAsPrincipal(apiKey.id, () => getDossierByPublicId(panContact))
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
      const panMinimal = testDossierId()
      await fixtures.dossierContactUtile({
        dossier: { publicId: panMinimal, visibilite: 'PUBLIC' },
        contactUtile: { nom: 'Contact minimal' },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getDossierByPublicId(panMinimal))
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
      const dosTri = testDossierId()
      await fixtures.dossier({ publicId: dosTri, visibilite: 'PUBLIC' })
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
      await fixtures.dossierContactUtile({
        dossier: { publicId: dosTri },
        contactUtile: { id: cZebra.id },
      })
      await fixtures.dossierContactUtile({
        dossier: { publicId: dosTri },
        contactUtile: { id: cAlpha.id },
      })
      await fixtures.dossierContactUtile({
        dossier: { publicId: dosTri },
        contactUtile: { id: cZeta.id },
      })
      const apiKey = await fixtures.apiKey()

      const groups = (
        await runAsPrincipal(apiKey.id, () => getDossierByPublicId(dosTri))
      )._unsafeUnwrap().contactsUtiles

      expect(groups.map((g) => g.organisme.nom)).toEqual(['Aaa Organisation', 'Zzz Organisation'])
      expect(groups[0]!.contacts.map((c) => c.nom)).toEqual(['Alpha', 'Zebra'])
      expect(groups[1]!.contacts.map((c) => c.nom)).toEqual(['Zeta'])
    }),
  )
})

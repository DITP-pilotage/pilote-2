import { describe, expect, it } from 'vitest'

import { upsertModalite } from '@/axe/commands/upsertModalite'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId, testModaliteId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

// Axe à deux niveaux (Famille → Type) avec une famille et un type.
const axeImbrique = async () => {
  const axe = { publicId: testAxeId() }
  await fixtures.niveauAxe({ axe, ordre: 1, nom: 'Famille' }, { axe, ordre: 2, nom: 'Type' })
  const famille = await fixtures.modalite({ nom: 'Fraude fiscale', niveau: { axe, ordre: 1 } })
  const type = await fixtures.modalite({
    nom: 'Fraude à la TVA',
    niveau: { axe, ordre: 2 },
    parent: { publicId: famille.publicId },
  })
  return { axePublicId: axe.publicId, famille, type }
}

const modaliteEnBase = async (publicId: string) => {
  const modalite = await db().modalite.findUniqueOrThrow({
    where: { publicId },
    include: { axe: true, niveauAxe: true, parent: true },
  })
  return {
    nom: modalite.nom,
    axe: modalite.axe.publicId,
    niveau: modalite.niveauAxe.ordre,
    parent: modalite.parent?.publicId ?? null,
  }
}

describe.concurrent('upsertModalite', () => {
  it(
    'crée une modalité du premier niveau quand elle n’a pas de parent',
    integrationTest(async () => {
      const { axePublicId } = await axeImbrique()
      const publicId = testModaliteId()

      const result = await runAsAdmin('principal-upsert-modalite-racine', () =>
        upsertModalite({ axePublicId, publicId, body: { nom: 'Fraude sociale', parent: null } }),
      )

      expect(result.isOk()).toBe(true)
      expect(await modaliteEnBase(publicId)).toEqual({
        nom: 'Fraude sociale',
        axe: axePublicId,
        niveau: 1,
        parent: null,
      })
    }),
  )

  it(
    'place la modalité au niveau qui suit celui de son parent',
    integrationTest(async () => {
      const { axePublicId, famille } = await axeImbrique()
      const publicId = testModaliteId()

      await runAsAdmin('principal-upsert-modalite-enfant', () =>
        upsertModalite({
          axePublicId,
          publicId,
          body: { nom: 'Fraude à l’IR', parent: famille.publicId },
        }),
      )

      expect(await modaliteEnBase(publicId)).toMatchObject({ niveau: 2, parent: famille.publicId })
    }),
  )

  it(
    'renomme une modalité existante sans toucher à son niveau ni à son parent',
    integrationTest(async () => {
      const { axePublicId, famille, type } = await axeImbrique()

      const result = await runAsAdmin('principal-upsert-modalite-renommage', () =>
        upsertModalite({
          axePublicId,
          publicId: type.publicId,
          body: { nom: 'TVA', parent: famille.publicId },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await modaliteEnBase(type.publicId)).toEqual({
        nom: 'TVA',
        axe: axePublicId,
        niveau: 2,
        parent: famille.publicId,
      })
    }),
  )

  it(
    'refuse de changer le parent d’une modalité existante',
    integrationTest(async () => {
      const { axePublicId, famille, type } = await axeImbrique()
      const autreFamille = await fixtures.modalite({
        niveau: { axe: { publicId: axePublicId }, ordre: 1 },
      })

      const result = await runAsAdmin('principal-upsert-modalite-deplacement', () =>
        upsertModalite({
          axePublicId,
          publicId: type.publicId,
          body: { nom: 'Fraude à la TVA', parent: autreFamille.publicId },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'CHANGEMENT_PARENT_INTERDIT',
        parentActuel: famille.publicId,
      })
      expect(await modaliteEnBase(type.publicId)).toMatchObject({ parent: famille.publicId })
    }),
  )

  it(
    'refuse de détacher une modalité de son parent',
    integrationTest(async () => {
      const { axePublicId, famille, type } = await axeImbrique()

      const result = await runAsAdmin('principal-upsert-modalite-detachement', () =>
        upsertModalite({
          axePublicId,
          publicId: type.publicId,
          body: { nom: 'Fraude à la TVA', parent: null },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'CHANGEMENT_PARENT_INTERDIT',
        parentActuel: famille.publicId,
      })
    }),
  )

  it(
    'refuse un parent inconnu',
    integrationTest(async () => {
      const { axePublicId } = await axeImbrique()
      const publicId = testModaliteId()

      const result = await runAsAdmin('principal-upsert-modalite-parent-inconnu', () =>
        upsertModalite({
          axePublicId,
          publicId,
          body: { nom: 'Orpheline', parent: testModaliteId() },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'PARENT_INCONNU' })
      expect(await db().modalite.findUnique({ where: { publicId } })).toBeNull()
    }),
  )

  it(
    'refuse un parent d’un autre axe',
    integrationTest(async () => {
      const { axePublicId } = await axeImbrique()
      const autreAxePublicId = testAxeId()
      const parent = await fixtures.modalite({ niveau: { axe: { publicId: autreAxePublicId } } })

      const result = await runAsAdmin('principal-upsert-modalite-parent-ailleurs', () =>
        upsertModalite({
          axePublicId,
          publicId: testModaliteId(),
          body: { nom: 'Mauvais parent', parent: parent.publicId },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'PARENT_AUTRE_AXE',
        axe: autreAxePublicId,
      })
    }),
  )

  it(
    'refuse un parent placé au dernier niveau de l’axe',
    integrationTest(async () => {
      const { axePublicId, type } = await axeImbrique()

      const result = await runAsAdmin('principal-upsert-modalite-trop-profonde', () =>
        upsertModalite({
          axePublicId,
          publicId: testModaliteId(),
          body: { nom: 'Trop profonde', parent: type.publicId },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'NIVEAU_INEXISTANT', ordre: 3 })
    }),
  )

  it(
    'refuse un identifiant déjà pris par une modalité d’un autre axe',
    integrationTest(async () => {
      const { axePublicId } = await axeImbrique()
      const autreAxePublicId = testAxeId()
      const ailleurs = await fixtures.modalite({
        nom: 'Ailleurs',
        niveau: { axe: { publicId: autreAxePublicId } },
      })

      const result = await runAsAdmin('principal-upsert-modalite-doublon', () =>
        upsertModalite({
          axePublicId,
          publicId: ailleurs.publicId,
          body: { nom: 'Doublon', parent: null },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_AUTRE_AXE',
        axe: autreAxePublicId,
      })
      expect(await modaliteEnBase(ailleurs.publicId)).toMatchObject({
        nom: 'Ailleurs',
        axe: autreAxePublicId,
      })
    }),
  )

  it(
    'échoue quand l’axe n’existe pas',
    integrationTest(async () => {
      await expect(
        runAsAdmin('principal-upsert-modalite-axe-inconnu', () =>
          upsertModalite({
            axePublicId: testAxeId(),
            publicId: testModaliteId(),
            body: { nom: 'Sans axe', parent: null },
          }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'refuse une clé API qui n’est pas ADMIN',
    integrationTest(async () => {
      const { axePublicId } = await axeImbrique()

      await expect(
        runAsContributor('principal-upsert-modalite-contributor', () =>
          upsertModalite({
            axePublicId,
            publicId: testModaliteId(),
            body: { nom: 'Interdite', parent: null },
          }),
        ),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})

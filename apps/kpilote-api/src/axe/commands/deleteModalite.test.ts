import { describe, expect, it } from 'vitest'

import { deleteModalite } from '@/axe/commands/deleteModalite'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId, testIndicateurId, testIndividuId, testModaliteId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

// Une famille et deux types : la famille a des enfants, les types n'en ont pas.
const familleEtTypes = async () => {
  const axe = { publicId: testAxeId() }
  const famille = await fixtures.modalite({ nom: 'Fraude fiscale', niveau: { axe, ordre: 1 } })
  const parent = { publicId: famille.publicId }
  const tva = await fixtures.modalite({ nom: 'Fraude à la TVA', niveau: { axe, ordre: 2 }, parent })
  const ir = await fixtures.modalite({ nom: 'Fraude à l’IR', niveau: { axe, ordre: 2 }, parent })
  return { axePublicId: axe.publicId, famille, tva, ir }
}

const existe = async (publicId: string) =>
  (await db().modalite.findUnique({ where: { publicId } })) !== null

const combinaisonExiste = async (id: string) =>
  (await db().combinaison.findUnique({ where: { id } })) !== null

describe.concurrent('deleteModalite', () => {
  it(
    'supprime une modalité sans enfants',
    integrationTest(async () => {
      const { axePublicId, famille, tva, ir } = await familleEtTypes()

      const result = await runAsAdmin('principal-delete-modalite', () =>
        deleteModalite({ axePublicId, publicId: tva.publicId }),
      )

      expect(result.isOk()).toBe(true)
      expect(await existe(tva.publicId)).toBe(false)
      expect(await existe(ir.publicId)).toBe(true)
      expect(await existe(famille.publicId)).toBe(true)
    }),
  )

  it(
    'refuse de supprimer une modalité qui a des enfants, et les liste',
    integrationTest(async () => {
      const { axePublicId, famille, tva, ir } = await familleEtTypes()

      const result = await runAsAdmin('principal-delete-modalite-enfants', () =>
        deleteModalite({ axePublicId, publicId: famille.publicId }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_A_DES_ENFANTS',
        enfants: [ir.publicId, tva.publicId].sort(),
      })
      expect(await existe(famille.publicId)).toBe(true)
    }),
  )

  it(
    'refuse de supprimer une modalité qui précise des valeurs',
    integrationTest(async () => {
      const { axePublicId, tva } = await familleEtTypes()
      await fixtures.valeurAvancement({
        indicateur: { publicId: testIndicateurId() },
        individu: { publicId: testIndividuId() },
        combinaison: { modalites: [{ publicId: tva.publicId }] },
      })

      const result = await runAsAdmin('principal-delete-modalite-utilisee', () =>
        deleteModalite({ axePublicId, publicId: tva.publicId }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'MODALITE_UTILISEE', valeurs: 1 })
      expect(await existe(tva.publicId)).toBe(true)
    }),
  )

  it(
    'supprime les combinaisons sans valeur de la modalité, pas celles des autres',
    integrationTest(async () => {
      const { axePublicId, tva, ir } = await familleEtTypes()
      const combinaisonTva = await fixtures.combinaison({ modalites: [{ publicId: tva.publicId }] })
      const valeurIr = await fixtures.valeurAvancement({
        indicateur: { publicId: testIndicateurId() },
        individu: { publicId: testIndividuId() },
        combinaison: { modalites: [{ publicId: ir.publicId }] },
      })

      const result = await runAsAdmin('principal-delete-modalite-combinaison-vide', () =>
        deleteModalite({ axePublicId, publicId: tva.publicId }),
      )

      expect(result.isOk()).toBe(true)
      expect(await existe(tva.publicId)).toBe(false)
      expect(await combinaisonExiste(combinaisonTva.id)).toBe(false)
      expect(await combinaisonExiste(valeurIr.combinaisonId)).toBe(true)
    }),
  )

  it(
    'supprime une combinaison sans valeur sur deux axes, sans toucher l’autre modalité',
    integrationTest(async () => {
      const { axePublicId, tva } = await familleEtTypes()
      const region = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })
      const combinaison = await fixtures.combinaison({
        modalites: [{ publicId: tva.publicId }, { publicId: region.publicId }],
      })

      const result = await runAsAdmin('principal-delete-modalite-deux-axes', () =>
        deleteModalite({ axePublicId, publicId: tva.publicId }),
      )

      expect(result.isOk()).toBe(true)
      expect(await combinaisonExiste(combinaison.id)).toBe(false)
      expect(await existe(region.publicId)).toBe(true)
    }),
  )

  it(
    'ne trouve pas une modalité d’un autre axe',
    integrationTest(async () => {
      const { tva } = await familleEtTypes()
      const autreAxe = await fixtures.axe()

      await expect(
        runAsAdmin('principal-delete-modalite-autre-axe', () =>
          deleteModalite({ axePublicId: autreAxe.publicId, publicId: tva.publicId }),
        ),
      ).rejects.toThrow(NotFoundError)
      expect(await existe(tva.publicId)).toBe(true)
    }),
  )

  it(
    'ne trouve pas une modalité inconnue',
    integrationTest(async () => {
      const { axePublicId } = await familleEtTypes()

      await expect(
        runAsAdmin('principal-delete-modalite-inconnue', () =>
          deleteModalite({ axePublicId, publicId: testModaliteId() }),
        ),
      ).rejects.toThrow(NotFoundError)
    }),
  )

  it(
    'refuse une clé API qui n’est pas ADMIN',
    integrationTest(async () => {
      const { axePublicId, tva } = await familleEtTypes()

      await expect(
        runAsContributor('principal-delete-modalite-contributor', () =>
          deleteModalite({ axePublicId, publicId: tva.publicId }),
        ),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
      expect(await existe(tva.publicId)).toBe(true)
    }),
  )
})

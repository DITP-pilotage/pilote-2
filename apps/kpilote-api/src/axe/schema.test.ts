import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId, testIndicateurId, testModaliteId } from '@/test/randomIds'

// Contraintes portées par la base sur le référentiel des axes. Une instruction
// refusée interrompt la transaction du test : elle est donc toujours la
// dernière du test.
describe.concurrent('schéma des axes', () => {
  it(
    'rattache une modalité à son axe, son niveau et son parent',
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      const famille = await fixtures.modalite({
        publicId: testModaliteId(),
        nom: 'Fraude fiscale',
        niveau: { axe, ordre: 1, nom: 'Famille' },
      })
      const type = await fixtures.modalite({
        publicId: testModaliteId(),
        nom: 'Fraude à la TVA',
        niveau: { axe, ordre: 2, nom: 'Type' },
        parent: { publicId: famille.publicId },
      })

      const axeRow = await db().axe.findUniqueOrThrow({
        where: { publicId: axe.publicId },
        include: { niveaux: { orderBy: { ordre: 'asc' } } },
      })
      expect(axeRow.niveaux.map((n) => [n.ordre, n.nom])).toEqual([
        [1, 'Famille'],
        [2, 'Type'],
      ])
      expect(type).toMatchObject({
        axeId: axeRow.id,
        niveauAxeId: axeRow.niveaux[1]!.id,
        parentId: famille.id,
      })
      expect(famille).toMatchObject({ axeId: axeRow.id, parentId: null })
    }),
  )

  it(
    "supprime les niveaux et les modalités d'un axe supprimé",
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      const famille = await fixtures.modalite({ niveau: { axe, ordre: 1 } })
      await fixtures.modalite({
        niveau: { axe, ordre: 2 },
        parent: { publicId: famille.publicId },
      })

      await db().axe.delete({ where: { publicId: axe.publicId } })

      expect(await db().niveauAxe.count({ where: { axeId: famille.axeId } })).toBe(0)
      expect(await db().modalite.count({ where: { axeId: famille.axeId } })).toBe(0)
    }),
  )

  it(
    'refuse deux niveaux de même ordre sur un axe',
    integrationTest(async () => {
      const niveau = await fixtures.niveauAxe({ axe: { publicId: testAxeId() }, ordre: 1 })

      await expect(
        db().niveauAxe.create({
          data: { id: uuidv7(), axeId: niveau.axeId, nom: 'Doublon', ordre: 1 },
        }),
      ).rejects.toThrow()
    }),
  )

  it(
    'refuse de supprimer un niveau qui porte des modalités',
    integrationTest(async () => {
      const modalite = await fixtures.modalite()

      await expect(db().niveauAxe.delete({ where: { id: modalite.niveauAxeId } })).rejects.toThrow()
    }),
  )

  it(
    'refuse de supprimer une modalité qui a des enfants',
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      const famille = await fixtures.modalite({ niveau: { axe, ordre: 1 } })
      await fixtures.modalite({
        niveau: { axe, ordre: 2 },
        parent: { publicId: famille.publicId },
      })

      await expect(db().modalite.delete({ where: { id: famille.id } })).rejects.toThrow()
    }),
  )

  it(
    'refuse deux axes de même ordre sur un indicateur',
    integrationTest(async () => {
      const indicateur = { publicId: testIndicateurId() }
      await fixtures.indicateurAxe({ indicateur, axe: { publicId: testAxeId() }, ordre: 1 })

      await expect(
        fixtures.indicateurAxe({ indicateur, axe: { publicId: testAxeId() }, ordre: 1 }),
      ).rejects.toThrow()
    }),
  )

  it(
    'refuse de supprimer un axe déclaré par un indicateur',
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      await fixtures.indicateurAxe({ indicateur: { publicId: testIndicateurId() }, axe })

      await expect(db().axe.delete({ where: { publicId: axe.publicId } })).rejects.toThrow()
    }),
  )

  it(
    'supprime la déclaration des axes avec l’indicateur',
    integrationTest(async () => {
      const indicateur = { publicId: testIndicateurId() }
      const declaration = await fixtures.indicateurAxe({
        indicateur,
        axe: { publicId: testAxeId() },
        fonction: 'AVG',
      })
      expect(declaration).toMatchObject({ ordre: 1, fonction: 'AVG' })

      await db().indicateur.delete({ where: { publicId: indicateur.publicId } })

      expect(await db().indicateurAxe.count({ where: { axeId: declaration.axeId } })).toBe(0)
    }),
  )

  it(
    'refuse une modalité de combinaison qui n’appartient pas à l’axe de la ligne',
    integrationTest(async () => {
      const operateur = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })
      const autreAxe = await fixtures.axe({ publicId: testAxeId() })
      const combinaison = await fixtures.combinaison({
        modalites: [{ publicId: operateur.publicId }],
      })
      expect(combinaison.cle).toBe(operateur.id)

      await expect(
        db().combinaisonModalite.create({
          data: { combinaisonId: combinaison.id, axeId: autreAxe.id, modaliteId: operateur.id },
        }),
      ).rejects.toThrow()
    }),
  )
})

import { describe, expect, it } from 'vitest'

import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { creerIndicateurIndividuCommentaire } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { listerIndicateurIndividuCommentaires } from '@/indicateur/queries/listerIndicateurIndividuCommentaires'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsPrincipal } from '@/test/runAsPrincipal'

// Commentaires sur une cellule d'un indicateur multi-dimension (cf.
// dimensions-design.md §5.2) : `DEPT~OP` (cellule complète) et `DEPT`
// (marginale) sont deux sujets distincts ; l'ordre des membres est indifférent.

describe.concurrent('commentaires — cellules multi-dimension', () => {
  it(
    'crée et liste séparément les commentaires de DEPT~OP et de DEPT',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
          {
            indicateur: { publicId: cube.indicateur },
            action: IndicateurPermissionAction.WRITE_COMMENT,
          },
        ],
      })
      const creer = (individuId: string, contenu: string) =>
        runAsPrincipal(apiKey.id, () =>
          creerIndicateurIndividuCommentaire({
            params: { indicateurId: cube.indicateur, individuId },
            body: { type: 'DEFAUT', contenu, statut: 'PUBLIE' },
          }),
        )
      const lister = async (individuId: string) =>
        (
          await runAsPrincipal(apiKey.id, () =>
            listerIndicateurIndividuCommentaires({
              params: { indicateurId: cube.indicateur, individuId },
              query: { type: 'DEFAUT' },
            }),
          )
        )._unsafeUnwrap()

      const cellule = await creer(`${cube.deptA}~${cube.orange}`, '<p>Cellule</p>')
      // Ordre inversé : même cellule, identifiant rendu en forme canonique.
      const inverse = await creer(`${cube.orange}~${cube.deptA}`, '<p>Inverse</p>')
      const marginale = await creer(cube.deptA, '<p>Marginale</p>')

      expect(cellule._unsafeUnwrap().individuId).toBe(`${cube.deptA}~${cube.orange}`)
      expect(inverse._unsafeUnwrap().individuId).toBe(`${cube.deptA}~${cube.orange}`)
      expect(marginale._unsafeUnwrap().individuId).toBe(cube.deptA)

      const pageCellule = await lister(`${cube.deptA}~${cube.orange}`)
      expect(pageCellule.total).toBe(2)
      expect(pageCellule.items.map((c) => c.contenu).sort()).toEqual([
        '<p>Cellule</p>',
        '<p>Inverse</p>',
      ])
      const pageMarginale = await lister(cube.deptA)
      expect(pageMarginale.total).toBe(1)
      expect(pageMarginale.items.map((c) => c.contenu)).toEqual(['<p>Marginale</p>'])
      expect((await lister(`${cube.deptA}~${cube.sfr}`)).total).toBe(0)
    }),
  )

  it(
    'refuse deux membres de la même dimension',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const apiKey = await fixtures.apiKey({
        permissions: [
          {
            indicateur: { publicId: cube.indicateur },
            action: IndicateurPermissionAction.WRITE_COMMENT,
          },
        ],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          creerIndicateurIndividuCommentaire({
            params: { indicateurId: cube.indicateur, individuId: `${cube.deptA}~${cube.deptB}` },
            body: { type: 'DEFAUT', contenu: '<p>x</p>', statut: 'PUBLIE' },
          }),
        ),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    }),
  )
})

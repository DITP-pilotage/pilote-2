import { describe, expect, it } from 'vitest'

import { combinaisonKey, upsertCombinaisons } from '@/axe/combinaison'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId } from '@/test/randomIds'

describe.concurrent('upsertCombinaisons', () => {
  it(
    'crée une combinaison une seule fois, quel que soit l’ordre des modalités',
    integrationTest(async () => {
      const orange = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })
      const tva = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })

      const premier = await upsertCombinaisons({ combinaisons: [[orange, tva]] })
      const second = await upsertCombinaisons({
        combinaisons: [
          [tva, orange],
          [orange, tva],
        ],
      })

      const cle = combinaisonKey({ modalites: [orange, tva] })
      expect(second).toEqual(premier)
      const combinaisons = await db().combinaison.findMany({
        where: { cle },
        include: { modalites: true },
      })
      expect(combinaisons).toHaveLength(1)
      expect(combinaisons[0]!.id).toBe(premier.get(cle))
      expect(
        combinaisons[0]!.modalites.map(({ axeId, modaliteId }) => ({ axeId, modaliteId })),
      ).toEqual(
        expect.arrayContaining([
          { axeId: orange.axeId, modaliteId: orange.id },
          { axeId: tva.axeId, modaliteId: tva.id },
        ]),
      )
    }),
  )

  it(
    'retrouve la combinaison vide sans rien créer',
    integrationTest(async () => {
      const idParCle = await upsertCombinaisons({ combinaisons: [[]] })

      const vide = await db().combinaison.findUniqueOrThrow({ where: { cle: '' } })
      expect(idParCle).toEqual(new Map([['', vide.id]]))
    }),
  )
})

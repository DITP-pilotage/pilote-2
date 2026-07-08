import { describe, expect, it } from 'vitest'

import { getReferentielByPublicId } from '@/referentiel/queries/getReferentielByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testReferentielId, testWidgetId } from '@/test/randomIds'

describe.concurrent('getReferentielByPublicId', () => {
  it(
    'retourne le référentiel avec sa population',
    integrationTest(async () => {
      const [dept1, dept2] = testDeptIds(2)
      const refTest = testReferentielId()
      await fixtures.individu(
        {
          publicId: dept1,
          referentiel: {
            publicId: refTest,
            nom: 'Référentiel de test',
            description: 'Description test',
          },
        },
        {
          publicId: dept2,
          referentiel: { publicId: refTest },
        },
      )

      const result = await getReferentielByPublicId(refTest)

      const value = result._unsafeUnwrap()
      expect(value).toMatchObject({
        id: refTest,
        nom: 'Référentiel de test',
        description: 'Description test',
        nombreIndividus: 2,
      })
    }),
  )

  it(
    'rejette quand le référentiel est introuvable',
    integrationTest(async () => {
      await expect(getReferentielByPublicId('REF-INCONNU')).rejects.toThrow()
    }),
  )

  it(
    'inclut les widgets rattachés au référentiel',
    integrationTest(async () => {
      const refCarto = testReferentielId()
      const widCarto = testWidgetId()
      await fixtures.referentielWidget({
        referentiel: { publicId: refCarto },
        widget: {
          publicId: widCarto,
          type: 'carte-france-departements',
          nom: 'Carte des départements',
          joinKey: 'codeInsee',
        },
      })

      const result = await getReferentielByPublicId(refCarto)

      const value = result._unsafeUnwrap()
      expect(value.widgets).toEqual([
        {
          id: widCarto,
          type: 'carte-france-departements',
          nom: 'Carte des départements',
          joinKey: 'codeInsee',
        },
      ])
    }),
  )

  it(
    "retourne un tableau widgets vide quand aucun widget n'est rattaché",
    integrationTest(async () => {
      const refNoWid = testReferentielId()
      await fixtures.referentiel({ publicId: refNoWid })

      const result = await getReferentielByPublicId(refNoWid)

      expect(result._unsafeUnwrap().widgets).toEqual([])
    }),
  )
})

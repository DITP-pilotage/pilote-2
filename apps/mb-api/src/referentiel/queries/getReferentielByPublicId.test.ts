import { describe, expect, it } from 'vitest'

import { getReferentielByPublicId } from '@/referentiel/queries/getReferentielByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds } from '@/test/randomIds'

describe.concurrent('getReferentielByPublicId', () => {
  it(
    'retourne le référentiel avec sa population',
    integrationTest(async () => {
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.individu(
        {
          publicId: dept1,
          referentiel: {
            publicId: 'REF-TEST',
            nom: 'Référentiel de test',
            description: 'Description test',
          },
        },
        {
          publicId: dept2,
          referentiel: { publicId: 'REF-TEST' },
        },
      )

      const result = await getReferentielByPublicId('REF-TEST')

      const value = result._unsafeUnwrap()
      expect(value).toMatchObject({
        id: 'REF-TEST',
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
      await fixtures.referentielWidget({
        referentiel: { publicId: 'REF-CARTO' },
        widget: {
          publicId: 'WID-CARTO-TEST',
          type: 'carte-france-departements',
          nom: 'Carte des départements',
          joinKey: 'codeInsee',
        },
      })

      const result = await getReferentielByPublicId('REF-CARTO')

      const value = result._unsafeUnwrap()
      expect(value.widgets).toEqual([
        {
          id: 'WID-CARTO-TEST',
          type: 'carte-france-departements',
          nom: 'Carte des départements',
          joinKey: 'codeInsee',
        },
      ])
    }),
  )

  it(
    'retourne un tableau widgets vide quand aucun widget n\'est rattaché',
    integrationTest(async () => {
      await fixtures.referentiel({ publicId: 'REF-NO-WID' })

      const result = await getReferentielByPublicId('REF-NO-WID')

      expect(result._unsafeUnwrap().widgets).toEqual([])
    }),
  )
})

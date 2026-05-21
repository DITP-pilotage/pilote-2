import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getIndicateurByPublicId', () => {
  it(
    "retourne l'indicateur avec ses référentiels liés triés par publicId",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indicateur = await fixtures.indicateur({ publicId: indId, nom: 'Indicateur de test' })
      const [refA, refB] = await fixtures.referentiel(
        { publicId: 'REF-DETAIL-B' },
        { publicId: 'REF-DETAIL-A' },
      )
      await db().indicateurReferentiel.createMany({
        data: [
          { indicateurId: indicateur.id, referentielId: refA!.id, fonctionAgregation: 'SUM' },
          { indicateurId: indicateur.id, referentielId: refB!.id, fonctionAgregation: 'SUM' },
        ],
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: indId,
        nom: 'Indicateur de test',
        referentiels: [
          { referentielPublicId: 'REF-DETAIL-A', fonctionAgregation: 'SUM' },
          { referentielPublicId: 'REF-DETAIL-B', fonctionAgregation: 'SUM' },
        ],
        createdAt: indicateur.createdAt.toISOString(),
        updatedAt: indicateur.updatedAt.toISOString(),
      })
    }),
  )

  it(
    "retourne l'indicateur quand le principal a la permission WRITE (WRITE implique READ)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().referentiels).toEqual([])
    }),
  )

  it(
    "lève une erreur quand le principal n'a aucune permission sur l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId)),
      ).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur quand aucun indicateur ne correspond',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(testIndicateurId())),
      ).rejects.toThrow()
    }),
  )
})

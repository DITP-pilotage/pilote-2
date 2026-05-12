import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { listReferentielsForIndicateur } from '@/indicateur/queries/listReferentielsForIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listReferentielsForIndicateur', () => {
  it(
    "lève une erreur quand l'indicateur n'existe pas ou n'est pas lisible",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () => listReferentielsForIndicateur(testIndicateurId())),
      ).rejects.toThrow()
    }),
  )

  it(
    "retourne items: [] quand aucun référentiel n'est lié",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listReferentielsForIndicateur(indId))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'retourne les ressources complètes triées par publicId ASC',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indicateur = await fixtures.indicateur({ publicId: indId })
      const refA = await fixtures.referentiel({ publicId: 'REF-LRFI-Z', nom: 'Z' })
      const refB = await fixtures.referentiel({
        publicId: 'REF-LRFI-A',
        nom: 'A',
        description: 'desc A',
      })
      // un individu lié à REF-LRFI-A pour vérifier nombreIndividus
      await fixtures.referentielIndividu({
        referentiel: { publicId: 'REF-LRFI-A' },
        individu: { publicId: 'LRFI-IND-1' },
      })
      await db().indicateurReferentiel.createMany({
        data: [
          { indicateurId: indicateur.id, referentielId: refA.id },
          { indicateurId: indicateur.id, referentielId: refB.id },
        ],
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listReferentielsForIndicateur(indId))

      const value = result._unsafeUnwrap()
      expect(value.items.map((r) => r.id)).toEqual(['REF-LRFI-A', 'REF-LRFI-Z'])
      expect(value.items[0]).toMatchObject({
        id: 'REF-LRFI-A',
        nom: 'A',
        description: 'desc A',
        nombreIndividus: 1,
      })
      expect(value.items[1]).toMatchObject({ id: 'REF-LRFI-Z', nom: 'Z', nombreIndividus: 0 })
    }),
  )
})

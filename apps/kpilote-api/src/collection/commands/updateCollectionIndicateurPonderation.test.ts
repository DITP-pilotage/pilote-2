import { describe, expect, it } from 'vitest'

import { updateCollectionIndicateurPonderation } from '@/collection/commands/updateCollectionIndicateurPonderation'
import { getCollectionTauxProgression } from '@/collection/queries/getCollectionTauxProgression'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testCollectionNumericId,
  testDeptId,
  testIndicateurId,
  testReferentielId,
} from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('updateCollectionIndicateurPonderation', () => {
  it(
    'remplace la pondération du lien',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        updateCollectionIndicateurPonderation(publicId, indicateurId, { ponderation: 3 }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, ponderation: 3 }])
    }),
  )

  it(
    'accepte une pondération nulle',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsAdmin(apiKey.id, () =>
        updateCollectionIndicateurPonderation(publicId, indicateurId, { ponderation: 0 }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, ponderation: 0 }])
    }),
  )

  it(
    'échoue si l’indicateur n’est pas affecté à la collection',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsAdmin(apiKey.id, () =>
          updateCollectionIndicateurPonderation(publicId, indicateurId, { ponderation: 2 }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({ publicId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsContributor(apiKey.id, () =>
          updateCollectionIndicateurPonderation(publicId, indicateurId, { ponderation: 2 }),
        ),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )

  it(
    'déplace le taux de progression de la collection vers l’indicateur repondéré',
    integrationTest(async () => {
      const refId = testReferentielId()
      const deptId = testDeptId()
      const indFaible = testIndicateurId()
      const indFort = testIndicateurId()
      const publicId = testCollectionNumericId()

      // Indicateur faible : 50 / 100 → 50 %. Indicateur fort : 80 / 100 → 80 %.
      for (const [indicateurId, valeur] of [
        [indFaible, 50],
        [indFort, 80],
      ] as const) {
        await fixtures.indicateurReferentiel({
          indicateur: { publicId: indicateurId },
          referentiel: { publicId: refId },
        })
        await fixtures.valeurAvancement({
          indicateur: { publicId: indicateurId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-06-01',
          valeur,
        })
        await fixtures.objectifIndicateurIndividu({
          indicateur: { publicId: indicateurId },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 100,
        })
      }
      await fixtures.collection({
        publicId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indFaible }, { publicId: indFort }],
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const avant = (
        await runAsAdmin(apiKey.id, () =>
          getCollectionTauxProgression(publicId, { individu: deptId }),
        )
      )._unsafeUnwrap().tauxProgression

      await runAsAdmin(apiKey.id, () =>
        updateCollectionIndicateurPonderation(publicId, indFort, { ponderation: 3 }),
      )

      const apres = (
        await runAsAdmin(apiKey.id, () =>
          getCollectionTauxProgression(publicId, { individu: deptId }),
        )
      )._unsafeUnwrap().tauxProgression

      expect(avant).not.toBeNull()
      expect(apres).not.toBeNull()
      expect(apres!).toBeGreaterThan(avant!)
    }),
  )
})

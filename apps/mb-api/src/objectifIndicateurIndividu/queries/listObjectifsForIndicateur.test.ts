import { describe, expect, it } from 'vitest'

import { listObjectifsForIndicateur } from '@/objectifIndicateurIndividu/queries/listObjectifsForIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listObjectifsForIndicateur', () => {
  it(
    'retourne les objectifs pour un individu triés par dateCible',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          dateCible: '2025-01-01',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          dateCible: '2026-01-01',
          valeurCible: 100,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          { indicateur: indId, individu: deptId, dateCible: '2025-01-01', valeurCible: 50 },
          { indicateur: indId, individu: deptId, dateCible: '2026-01-01', valeurCible: 100 },
        ],
      })
    }),
  )

  it(
    'retourne les objectifs pour plusieurs individus',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: refId } },
          dateCible: '2025-01-01',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: refId } },
          dateCible: '2025-01-01',
          valeurCible: 80,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [dept1, dept2] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(2)
      const individus = items.map((i) => i.individu)
      expect(individus).toContain(dept1)
      expect(individus).toContain(dept2)
    }),
  )

  it(
    "retourne une liste vide quand aucun objectif n'existe pour les individus demandés",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu({ publicId: deptId, referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'ignore silencieusement les individus inconnus',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        dateCible: '2025-01-01',
        valeurCible: 50,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [deptId, 'DEPT-999'] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]!.individu).toBe(deptId)
    }),
  )
})

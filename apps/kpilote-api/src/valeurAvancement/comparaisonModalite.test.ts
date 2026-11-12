import { describe, expect, it } from 'vitest'

import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testApiKeyRawKey,
  testAxeId,
  testDeptId,
  testIndicateurNumericId,
  testModaliteId,
  testReferentielId,
} from '@/test/randomIds'
import { valeurAvancementRoutes } from '@/valeurAvancement/routes'

// Comparaison des départements pour une modalité : la population est
// « départements × modalité ». Orange n'a jamais de valeur dans le département C.
//
//            Orange   SFR    Tous
//   A          10      5      15
//   B          20      –      20
//   C           –      7       7
const tranche = async () => {
  const refDept = { publicId: testReferentielId().toUpperCase() }
  const [a, b, c] = [testDeptId(), testDeptId(), testDeptId()].map((publicId) => ({
    publicId,
    referentiel: refDept,
  }))
  const indicateurId = testIndicateurNumericId()
  const indicateur = { publicId: indicateurId }
  await fixtures.indicateurReferentiel({ indicateur, referentiel: refDept })
  const axe = { publicId: testAxeId() }
  const [orange, sfr] = [testModaliteId(), testModaliteId()]
  await fixtures.modalite(
    { publicId: orange, nom: 'Orange', niveau: { axe } },
    { publicId: sfr, nom: 'SFR', niveau: { axe } },
  )
  await fixtures.indicateurAxe({ indicateur, axe, fonction: 'SUM' })
  for (const [individu, modalite, valeur] of [
    [a!, orange, 10],
    [a!, sfr, 5],
    [b!, orange, 20],
    [c!, sfr, 7],
  ] as const) {
    await fixtures.valeurAvancement({
      indicateur,
      individu,
      date: '2025-01-01',
      valeur,
      combinaison: { modalites: [{ publicId: modalite }] },
    })
  }
  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({
    rawKey,
    permissions: [{ indicateur, action: IndicateurPermissionAction.READ }],
  })
  return { indicateurId, refDept: refDept.publicId, a: a!.publicId, c: c!.publicId, orange, rawKey }
}

const lire = async <T>(rawKey: string, path: string): Promise<T> => {
  const response = await buildTestApp(valeurAvancementRoutes).request(path, {
    headers: { Authorization: `Bearer ${rawKey}` },
  })
  expect(response.status).toBe(200)
  return (await response.json()) as T
}

type Remarquables = {
  items: Array<{
    min: number | null
    max: number | null
    mediane: number | null
    contributions: Array<{ individu: string; valeur: number }>
  }>
}
type Synthese = { items: Array<{ individu: string; ecartMediane: number | null }> }

describe.concurrent('comparaison et carte pour une modalité', () => {
  it(
    'valeurs remarquables sur « Tous » : sur les trois départements',
    integrationTest(async () => {
      const t = await tranche()

      const body = await lire<Remarquables>(
        t.rawKey,
        `/indicateurs/${t.indicateurId}/valeurs-remarquables?referentiels=${t.refDept}`,
      )

      expect(body.items[0]).toMatchObject({ min: 7, max: 20, mediane: 15 })
    }),
  )

  it(
    'valeurs remarquables pour Orange : le département sans Orange sort de la population',
    integrationTest(async () => {
      const t = await tranche()

      const body = await lire<Remarquables>(
        t.rawKey,
        `/indicateurs/${t.indicateurId}/valeurs-remarquables?referentiels=${t.refDept}&modalites=${t.orange}`,
      )

      expect(body.items[0]).toMatchObject({ min: 10, max: 20, mediane: 15 })
      // Données de la carte : pas de valeur pour C.
      expect(
        body.items[0]?.contributions.map((contribution) => contribution.individu),
      ).not.toContain(t.c)
    }),
  )

  it(
    'synthèse pour Orange : écart à la médiane des départements qui ont Orange',
    integrationTest(async () => {
      const t = await tranche()

      const body = await lire<Synthese>(
        t.rawKey,
        `/indicateurs/${t.indicateurId}/synthese-individus?individus=${t.a},${t.c}&modalites=${t.orange}`,
      )

      const parIndividu = new Map(body.items.map((item) => [item.individu, item.ecartMediane]))
      expect(parIndividu.get(t.a)).toBe(-5)
      expect(parIndividu.get(t.c)).toBeNull()
    }),
  )

  it(
    'refuse (400) une modalité inconnue',
    integrationTest(async () => {
      const t = await tranche()

      const response = await buildTestApp(valeurAvancementRoutes).request(
        `/indicateurs/${t.indicateurId}/synthese-individus?individus=${t.a}&modalites=${testModaliteId()}`,
        { headers: { Authorization: `Bearer ${t.rawKey}` } },
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'MODALITE_INCONNUE' })
    }),
  )
})

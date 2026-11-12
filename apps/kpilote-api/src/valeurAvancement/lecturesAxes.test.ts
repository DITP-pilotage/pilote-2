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
  testRegId,
} from '@/test/randomIds'
import { valeurAvancementRoutes } from '@/valeurAvancement/routes'

// Lectures d'un indicateur à axes (chemin 1), sur l'exemple « points d'accueil
// pour 10 000 habitants » de PIL-1963 : moyenne sur le territoire, somme sur
// les opérateurs ; la CAF n'a jamais de valeur dans le 13.
const DATE = '2025-01-01'

type Point = {
  individu: string
  valeur: number
  type: string
  contributions?: Array<{ individu: string; modalites?: string[]; valeur: number | null }>
}

const paca = async () => {
  const refReg = { publicId: testReferentielId().toUpperCase() }
  const refDept = { publicId: testReferentielId().toUpperCase() }
  const reg = { publicId: testRegId(), referentiel: refReg }
  const d84 = { publicId: testDeptId(), referentiel: refDept }
  const d13 = { publicId: testDeptId(), referentiel: refDept }
  await fixtures.relation({ parent: reg, child: d84 }, { parent: reg, child: d13 })

  const indicateurId = testIndicateurNumericId()
  const indicateur = { publicId: indicateurId }
  await fixtures.indicateurReferentiel(
    { indicateur, referentiel: refReg, fonctionAgregation: 'AVG' },
    { indicateur, referentiel: refDept, fonctionAgregation: 'SUM' },
  )

  const axe = { publicId: testAxeId() }
  const [ft, caf] = [testModaliteId(), testModaliteId()]
  await fixtures.modalite(
    { publicId: ft, nom: 'France Travail', niveau: { axe } },
    { publicId: caf, nom: 'CAF', niveau: { axe } },
  )
  await fixtures.indicateurAxe({ indicateur, axe, fonction: 'SUM' })

  const valeur = (individu: typeof d84, modalite: string, v: number) =>
    fixtures.valeurAvancement({
      indicateur,
      individu,
      date: DATE,
      valeur: v,
      combinaison: { modalites: [{ publicId: modalite }] },
    })
  await valeur(d84, ft, 1)
  await valeur(d84, caf, 2)
  await valeur(d13, ft, 3)
  // Les objectifs se saisissent sur les départements et remontent comme
  // aujourd'hui (moyenne) : objectif régional = 6.
  await fixtures.objectifIndicateurIndividu(
    { indicateur, individu: d84, dateCible: '2025-12-01', valeurCible: 6 },
    { indicateur, individu: d13, dateCible: '2025-12-01', valeurCible: 6 },
  )

  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({
    rawKey,
    permissions: [{ indicateur, action: IndicateurPermissionAction.READ }],
  })
  return { indicateurId, reg: reg.publicId, d84: d84.publicId, d13: d13.publicId, ft, caf, rawKey }
}

const lire = (rawKey: string, path: string) =>
  buildTestApp(valeurAvancementRoutes).request(path, {
    headers: { Authorization: `Bearer ${rawKey}` },
  })

const points = async (rawKey: string, path: string): Promise<Point[]> => {
  const response = await lire(rawKey, path)
  expect(response.status).toBe(200)
  return ((await response.json()) as { items: Point[] }).items
}

describe.concurrent('lectures d’un indicateur à axes', () => {
  it(
    'sans modalité : « Tous », axes combinés dans chaque département puis moyenne régionale',
    integrationTest(async () => {
      const c = await paca()

      const items = await points(
        c.rawKey,
        `/indicateurs/${c.indicateurId}/valeurs?individus=${c.reg},${c.d84},${c.d13}`,
      )

      expect(items.map(({ individu, valeur }) => ({ individu, valeur }))).toEqual(
        expect.arrayContaining([
          { individu: c.reg, valeur: 3 },
          { individu: c.d84, valeur: 3 },
          { individu: c.d13, valeur: 3 },
        ]),
      )
      expect(items).toHaveLength(3)
      const d84 = items.find((point) => point.individu === c.d84)
      expect(d84?.contributions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ individu: c.d84, modalites: [c.ft], valeur: 1 }),
          expect.objectContaining({ individu: c.d84, modalites: [c.caf], valeur: 2 }),
        ]),
      )
    }),
  )

  it(
    'avec une modalité : France Travail en région = (1 + 3) / 2 = 2',
    integrationTest(async () => {
      const c = await paca()

      const items = await points(
        c.rawKey,
        `/indicateurs/${c.indicateurId}/valeurs?individus=${c.reg}&modalites=${c.ft}`,
      )

      expect(items).toMatchObject([{ individu: c.reg, valeur: 2 }])
    }),
  )

  it(
    'une modalité jamais vue dans un département : pas de valeur',
    integrationTest(async () => {
      const c = await paca()

      const items = await points(
        c.rawKey,
        `/indicateurs/${c.indicateurId}/valeurs?individus=${c.d13}&modalites=${c.caf}`,
      )

      expect(items).toEqual([])
    }),
  )

  it(
    'taux de progression : « Tous » / objectif de l’individu',
    integrationTest(async () => {
      const c = await paca()

      const response = await lire(
        c.rawKey,
        `/indicateurs/${c.indicateurId}/taux-progression?individus=${c.reg}`,
      )

      expect(response.status).toBe(200)
      const body = (await response.json()) as {
        items: Array<{ valeur: number; valeurCible: number }>
      }
      expect(body.items.at(-1)).toMatchObject({ valeur: 3, valeurCible: 6 })
    }),
  )

  it(
    'refuse (400) une modalité inconnue',
    integrationTest(async () => {
      const c = await paca()

      const response = await lire(
        c.rawKey,
        `/indicateurs/${c.indicateurId}/valeurs?individus=${c.reg}&modalites=${testModaliteId()}`,
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'MODALITE_INCONNUE' })
    }),
  )

  it(
    'refuse (400) une modalité d’un axe que l’indicateur ne déclare pas',
    integrationTest(async () => {
      const c = await paca()
      const ailleurs = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })

      const response = await lire(
        c.rawKey,
        `/indicateurs/${c.indicateurId}/valeurs?individus=${c.reg}&modalites=${ailleurs.publicId}`,
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        code: 'AXE_NON_DECLARE',
        details: { modalites: [ailleurs.publicId] },
      })
    }),
  )

  it(
    'refuse (400) deux modalités du même axe',
    integrationTest(async () => {
      const c = await paca()

      const response = await lire(
        c.rawKey,
        `/indicateurs/${c.indicateurId}/valeurs?individus=${c.reg}&modalites=${c.ft},${c.caf}`,
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'MODALITES_MEME_AXE' })
    }),
  )
})

describe.concurrent('lectures d’un indicateur à axe imbriqué', () => {
  it(
    'lit une modalité parente : Fraude fiscale = TVA + IR',
    integrationTest(async () => {
      const refDept = { publicId: testReferentielId().toUpperCase() }
      const d84 = { publicId: testDeptId(), referentiel: refDept }
      const indicateurId = testIndicateurNumericId()
      const indicateur = { publicId: indicateurId }
      await fixtures.indicateurReferentiel({ indicateur, referentiel: refDept })
      const axe = { publicId: testAxeId() }
      const fiscale = await fixtures.modalite({ niveau: { axe, ordre: 1 } })
      const parent = { publicId: fiscale.publicId }
      const [tva, ir] = await fixtures.modalite(
        { niveau: { axe, ordre: 2 }, parent },
        { niveau: { axe, ordre: 2 }, parent },
      )
      await fixtures.indicateurAxe({ indicateur, axe, fonction: 'SUM' })
      for (const [modalite, valeur] of [
        [tva!, 5],
        [ir!, 3],
      ] as const) {
        await fixtures.valeurAvancement({
          indicateur,
          individu: d84,
          date: DATE,
          valeur,
          combinaison: { modalites: [{ publicId: modalite.publicId }] },
        })
      }
      const rawKey = testApiKeyRawKey()
      await fixtures.apiKey({
        rawKey,
        permissions: [{ indicateur, action: IndicateurPermissionAction.READ }],
      })

      const items = await points(
        rawKey,
        `/indicateurs/${indicateurId}/valeurs?individus=${d84.publicId}&modalites=${fiscale.publicId}`,
      )

      expect(items).toMatchObject([{ individu: d84.publicId, valeur: 8 }])
    }),
  )
})

describe.concurrent('lectures d’un indicateur sans axe', () => {
  it(
    'refuse (400) toute modalité',
    integrationTest(async () => {
      const refDept = { publicId: testReferentielId().toUpperCase() }
      const d84 = { publicId: testDeptId(), referentiel: refDept }
      const indicateurId = testIndicateurNumericId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indicateurId },
        referentiel: refDept,
      })
      await fixtures.valeurAvancement({ indicateur: { publicId: indicateurId }, individu: d84 })
      const modalite = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })
      const rawKey = testApiKeyRawKey()
      await fixtures.apiKey({
        rawKey,
        permissions: [
          { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.READ },
        ],
      })

      const response = await lire(
        rawKey,
        `/indicateurs/${indicateurId}/valeurs?individus=${d84.publicId}&modalites=${modalite.publicId}`,
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'AXE_NON_DECLARE' })
    }),
  )
})

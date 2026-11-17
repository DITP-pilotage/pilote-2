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
  testReferentielId,
} from '@/test/randomIds'
import { valeurAvancementRoutes } from '@/valeurAvancement/routes'

// Deux indicateurs identiques sur le même département : le témoin n'a que des
// valeurs sur la combinaison vide ; l'autre a en plus une valeur sur {Orange},
// à une date plus récente et beaucoup plus grande. Les lectures visent la
// combinaison vide : elles doivent renvoyer exactement la même chose pour les
// deux indicateurs.
const deuxIndicateurs = async () => {
  const referentiel = { publicId: testReferentielId().toUpperCase() }
  const individu = { publicId: testDeptId(), referentiel }
  const orange = await fixtures.modalite({
    nom: 'Orange',
    niveau: { axe: { publicId: testAxeId() } },
  })
  const [temoin, avecOrange] = [testIndicateurNumericId(), testIndicateurNumericId()]

  for (const indicateurId of [temoin, avecOrange]) {
    const indicateur = { publicId: indicateurId }
    await fixtures.indicateurReferentiel({ indicateur, referentiel })
    await fixtures.valeurAvancement(
      { indicateur, individu, date: '2025-01-01', valeur: 10 },
      { indicateur, individu, date: '2025-02-01', valeur: 12 },
    )
    await fixtures.objectifIndicateurIndividu({
      indicateur,
      individu,
      dateCible: '2025-12-01',
      valeurCible: 20,
    })
  }
  await fixtures.valeurAvancement({
    indicateur: { publicId: avecOrange },
    individu,
    date: '2025-03-01',
    valeur: 999,
    combinaison: { modalites: [{ publicId: orange.publicId }] },
  })

  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({
    rawKey,
    permissions: [temoin, avecOrange].map((publicId) => ({
      indicateur: { publicId },
      action: IndicateurPermissionAction.READ,
    })),
  })
  return {
    temoin,
    avecOrange,
    individuId: individu.publicId,
    referentielId: referentiel.publicId,
    rawKey,
  }
}

const lire = async (rawKey: string, path: string): Promise<unknown> => {
  const response = await buildTestApp(valeurAvancementRoutes).request(path, {
    headers: { Authorization: `Bearer ${rawKey}` },
  })
  expect(response.status).toBe(200)
  return response.json()
}

// Réponse d'un indicateur, son identifiant remplacé pour comparer au témoin.
const lirePour = async (rawKey: string, indicateurId: string, path: string) =>
  JSON.parse(JSON.stringify(await lire(rawKey, path)).replaceAll(indicateurId, 'IND-X')) as unknown

describe.concurrent('lectures de valeurs : seule la combinaison vide est lue', () => {
  const routes: Array<{
    nom: string
    path: (c: Awaited<ReturnType<typeof deuxIndicateurs>>, id: string) => string
  }> = [
    { nom: 'séries', path: (c, id) => `/indicateurs/${id}/valeurs?individus=${c.individuId}` },
    {
      nom: 'valeurs remarquables',
      path: (c, id) => `/indicateurs/${id}/valeurs-remarquables?referentiels=${c.referentielId}`,
    },
    {
      nom: 'synthèse',
      path: (c, id) => `/indicateurs/${id}/synthese-individus?individus=${c.individuId}`,
    },
    {
      nom: 'dernières valeurs',
      path: (c, id) => `/individus/${c.individuId}/dernieres-valeurs?indicateurs=${id}`,
    },
    {
      nom: 'taux de progression',
      path: (c, id) => `/indicateurs/${id}/taux-progression?individus=${c.individuId}`,
    },
  ]

  for (const route of routes) {
    it(
      `${route.nom} : une valeur sur une autre combinaison est ignorée`,
      integrationTest(async () => {
        const contexte = await deuxIndicateurs()

        const temoin = await lirePour(
          contexte.rawKey,
          contexte.temoin,
          route.path(contexte, contexte.temoin),
        )
        const avecOrange = await lirePour(
          contexte.rawKey,
          contexte.avecOrange,
          route.path(contexte, contexte.avecOrange),
        )

        expect(JSON.stringify(temoin)).not.toContain('999')
        expect(avecOrange).toEqual(temoin)
      }),
    )
  }
})

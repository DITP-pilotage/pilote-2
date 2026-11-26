import { describe, expect, it } from 'vitest'

import { listCollectionTauxProgression } from '@/collection/queries/listCollectionTauxProgression'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testCollectionId,
  testIndicateurIds,
  testIndividuId,
  testReferentielIds,
  testRegId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

// Une collection qui mêle un indicateur régional (taux 20 %) et un indicateur
// de bassin (taux 60 %), chacun saisi sur un seul individu, racine de son référentiel.
const collectionMixte = async () => {
  const colId = testCollectionId()
  const [indRegional, indBassin] = testIndicateurIds(2)
  const regId = testRegId()
  const bassinId = testIndividuId()
  const [refReg, refBassin] = testReferentielIds(2)
  await fixtures.indicateurReferentiel(
    { indicateur: { publicId: indRegional }, referentiel: { publicId: refReg } },
    { indicateur: { publicId: indBassin }, referentiel: { publicId: refBassin } },
  )
  await fixtures.valeurAvancement(
    {
      indicateur: { publicId: indRegional },
      individu: { publicId: regId, referentiel: { publicId: refReg } },
      date: '2024-06-01',
      valeur: 20,
    },
    {
      indicateur: { publicId: indBassin },
      individu: { publicId: bassinId, referentiel: { publicId: refBassin } },
      date: '2024-06-01',
      valeur: 60,
    },
  )
  await fixtures.objectifIndicateurIndividu(
    {
      indicateur: { publicId: indRegional },
      individu: { publicId: regId },
      dateCible: '2024-12-31',
      valeurCible: 100,
    },
    {
      indicateur: { publicId: indBassin },
      individu: { publicId: bassinId },
      dateCible: '2024-12-31',
      valeurCible: 100,
    },
  )
  await fixtures.collection({
    publicId: colId,
    visibilite: 'PUBLIC',
    indicateurs: [{ publicId: indRegional }, { publicId: indBassin }],
  })
  const apiKey = await fixtures.apiKey()
  return { colId, regId, bassinId, apiKeyId: apiKey.id }
}

describe.concurrent('listCollectionTauxProgression', () => {
  it(
    'fait contribuer chaque indicateur avec sa propre racine sans sélection',
    integrationTest(async () => {
      const { colId, apiKeyId } = await collectionMixte()

      const result = await runAsPrincipal(apiKeyId, () =>
        listCollectionTauxProgression({ query: { collections: [colId] } }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ collection: colId, tauxProgression: 40, raisonSansTaux: null }],
      })
    }),
  )

  it(
    'fait contribuer chaque indicateur avec son individu sélectionné',
    integrationTest(async () => {
      const { colId, regId, bassinId, apiKeyId } = await collectionMixte()

      const result = await runAsPrincipal(apiKeyId, () =>
        listCollectionTauxProgression({
          query: { collections: [colId], individus: [regId, bassinId] },
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ collection: colId, tauxProgression: 40, raisonSansTaux: null }],
      })
    }),
  )

  it(
    "n'a pas de taux quand un indicateur n'est concerné par aucun individu sélectionné",
    integrationTest(async () => {
      const { colId, regId, apiKeyId } = await collectionMixte()

      const result = await runAsPrincipal(apiKeyId, () =>
        listCollectionTauxProgression({ query: { collections: [colId], individus: [regId] } }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            collection: colId,
            tauxProgression: null,
            raisonSansTaux: 'INDICATEUR_NON_CALCULABLE',
          },
        ],
      })
    }),
  )
})

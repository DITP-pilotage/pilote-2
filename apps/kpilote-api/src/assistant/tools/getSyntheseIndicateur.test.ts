import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { getSyntheseIndicateur } from '@/assistant/tools/getSyntheseIndicateur'
import { UniteIndicateur, Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndividuId, testReferentielIds } from '@/test/randomIds'
import { runToolAs } from '@/test/toolHarness'

const token = () => randomUUID().slice(0, 8)

const givenIndicateurAvecValeur = async (
  visibilite: Visibilite,
  sensSouhaite: 'HAUSSE' | 'BAISSE' = 'HAUSSE',
) => {
  const marqueur = token()
  const referentiel = await fixtures.referentiel({ nom: `Départements ${marqueur}` })
  const indicateur = await fixtures.indicateur({
    nom: `Chômage ${marqueur}`,
    visibilite,
    unite: UniteIndicateur.POURCENTAGE,
    sensSouhaite,
  })
  await fixtures.indicateurReferentiel({ indicateur, referentiel })
  const { id, publicId } = await fixtures.individu({ nom: `Vaucluse ${marqueur}`, referentiel })
  const individu = { id, publicId }
  await fixtures.valeurAvancement(
    { indicateur, individu, date: '2026-01-01', valeur: 9.5 },
    { indicateur, individu, date: '2026-02-01', valeur: 9.1 },
  )
  await fixtures.objectifIndicateurIndividu({
    indicateur,
    individu,
    dateCible: '2027-01-01',
    valeurCible: 7,
  })
  return { indicateur, individu, referentiel, marqueur }
}

// Une région qui somme deux départements, un troisième département hors de la
// région (il compte dans la médiane et les valeurs remarquables des départements),
// un référentiel de l'indicateur sans individu, et une commune d'un référentiel
// qui n'est pas lié à l'indicateur.
const givenRegionAgregee = async () => {
  const marqueur = token()
  const indicateur = await fixtures.indicateur({
    nom: `Emplois ${marqueur}`,
    visibilite: Visibilite.PUBLIC,
  })
  // Ids triés : les valeurs remarquables sortent dans cet ordre.
  const [refDept, refReg, refVide, refCommune] = testReferentielIds(4)
  const [region, deptA, deptB, deptC, commune] = [
    testIndividuId(),
    testIndividuId(),
    testIndividuId(),
    testIndividuId(),
    testIndividuId(),
  ]
  await fixtures.indicateurReferentiel(
    {
      indicateur,
      referentiel: { publicId: refReg, nom: `Régions ${marqueur}` },
      fonctionAgregation: 'SUM',
    },
    {
      indicateur,
      referentiel: { publicId: refDept, nom: `Départements ${marqueur}` },
      fonctionAgregation: 'NONE',
    },
    {
      indicateur,
      referentiel: { publicId: refVide, nom: `Vide ${marqueur}` },
      fonctionAgregation: 'NONE',
    },
  )
  await fixtures.individu(
    { publicId: region, nom: `A région ${marqueur}`, referentiel: { publicId: refReg } },
    { publicId: deptA, nom: `B département ${marqueur}`, referentiel: { publicId: refDept } },
    { publicId: deptB, referentiel: { publicId: refDept } },
    { publicId: deptC, referentiel: { publicId: refDept } },
    { publicId: commune, nom: `C commune ${marqueur}`, referentiel: { publicId: refCommune } },
  )
  await fixtures.relation(
    { parent: { publicId: region }, child: { publicId: deptA } },
    { parent: { publicId: region }, child: { publicId: deptB } },
  )
  const valeur = (individu: string, date: string, valeur: number) => ({
    indicateur,
    individu: { publicId: individu },
    date,
    valeur,
  })
  await fixtures.valeurAvancement(
    valeur(deptA, '2026-01-01', 10),
    valeur(deptA, '2026-02-01', 12),
    valeur(deptB, '2026-01-01', 5),
    valeur(deptB, '2026-03-01', 6),
    valeur(deptC, '2026-02-01', 20),
    valeur(commune, '2026-01-01', 7),
    valeur(commune, '2026-02-01', 9),
  )
  await fixtures.objectifIndicateurIndividu(
    { indicateur, individu: { publicId: deptA }, dateCible: '2026-12-31', valeurCible: 15 },
    { indicateur, individu: { publicId: deptA }, dateCible: '2027-06-30', valeurCible: 20 },
    { indicateur, individu: { publicId: deptB }, dateCible: '2027-06-30', valeurCible: 10 },
  )
  return { indicateur, marqueur, refReg, refDept, refVide, region, deptA, commune }
}

describe('get_synthese_indicateur', () => {
  it(
    'lit la dernière valeur, la variation, la médiane et le taux d’un agrégé, d’une feuille et d’un individu hors des référentiels de l’indicateur',
    integrationTest(async () => {
      const { indicateur, marqueur, refReg, refDept, refVide, region, deptA, commune } =
        await givenRegionAgregee()

      const output = await runToolAs(
        randomUUID(),
        'get_synthese_indicateur',
        getSyntheseIndicateur,
        {
          indicateurId: indicateur.publicId,
          perimetre: { type: 'SELECTION', individuIds: [commune, deptA, region] },
        },
      )

      expect(output).toEqual(
        expect.objectContaining({
          individus: [
            {
              individu: { id: region, nom: `A région ${marqueur}` },
              // La région reporte la dernière valeur de chaque département : 12 + 6 en mars.
              derniereValeur: { valeur: 18, date: '2026-03-01' },
              // L'objectif se lit à l'année, le taux au mois.
              objectif: { valeur: 30, date: '2027-01-01' },
              tauxProgression: 60,
              variation: 1,
              lectureVariation: 'favorable',
              ecartMediane: 0,
              lectureEcartMediane: 'neutral',
            },
            {
              individu: { id: deptA, nom: `B département ${marqueur}` },
              derniereValeur: { valeur: 12, date: '2026-02-01' },
              // L'objectif affiché est le plus lointain ; le taux lit le prochain à échoir.
              objectif: { valeur: 20, date: '2027-01-01' },
              tauxProgression: 80,
              variation: 2,
              lectureVariation: 'favorable',
              ecartMediane: 0,
              lectureEcartMediane: 'neutral',
            },
            {
              // Médiane de ses pairs, mais pas de valeurs remarquables pour son référentiel.
              individu: { id: commune, nom: `C commune ${marqueur}` },
              derniereValeur: { valeur: 9, date: '2026-02-01' },
              objectif: null,
              tauxProgression: null,
              variation: 2,
              lectureVariation: 'favorable',
              ecartMediane: 0,
              lectureEcartMediane: 'neutral',
            },
          ],
          valeursRemarquables: [
            {
              referentiel: { id: refDept, nom: `Départements ${marqueur}` },
              min: 6,
              max: 20,
              mediane: 12,
            },
            {
              referentiel: { id: refReg, nom: `Régions ${marqueur}` },
              min: 18,
              max: 18,
              mediane: 18,
            },
            {
              referentiel: { id: refVide, nom: `Vide ${marqueur}` },
              min: null,
              max: null,
              mediane: null,
            },
          ],
        }),
      )
    }),
  )

  it(
    'dresse l’état de l’indicateur pour un individu',
    integrationTest(async () => {
      const { indicateur, individu, referentiel, marqueur } = await givenIndicateurAvecValeur(
        Visibilite.PUBLIC,
      )

      const output = await runToolAs(
        randomUUID(),
        'get_synthese_indicateur',
        getSyntheseIndicateur,
        {
          indicateurId: indicateur.publicId,
          individuId: individu.publicId,
        },
      )

      expect(output).toEqual(
        expect.objectContaining({
          indicateur: expect.objectContaining({
            id: indicateur.publicId,
            nom: `Chômage ${marqueur}`,
            unite: 'Pourcentage',
            referentiels: [{ id: referentiel.publicId, nom: `Départements ${marqueur}` }],
          }),
          individus: [
            expect.objectContaining({
              individu: { id: individu.publicId, nom: `Vaucluse ${marqueur}` },
              derniereValeur: { valeur: 9.1, date: '2026-02-01' },
              objectif: { valeur: 7, date: '2027-01-01' },
            }),
          ],
          notFound: [],
        }),
      )
    }),
  )

  it(
    'donne le sens souhaité et lit la variation selon ce sens, sans taux à la baisse',
    integrationTest(async () => {
      // Chômage de 9,5 à 9,1 : la baisse est favorable pour un indicateur à la baisse.
      const { indicateur, individu } = await givenIndicateurAvecValeur(Visibilite.PUBLIC, 'BAISSE')

      const output = await runToolAs(
        randomUUID(),
        'get_synthese_indicateur',
        getSyntheseIndicateur,
        {
          indicateurId: indicateur.publicId,
          individuId: individu.publicId,
        },
      )

      expect(output).toEqual(
        expect.objectContaining({
          indicateur: expect.objectContaining({ sensSouhaite: 'BAISSE' }),
          individus: [
            expect.objectContaining({
              tauxProgression: null,
              lectureVariation: 'favorable',
              lectureEcartMediane: 'neutral',
            }),
          ],
        }),
      )
    }),
  )

  it(
    'rend notFound pour un indicateur que le principal ne peut pas lire',
    integrationTest(async () => {
      const { indicateur, individu } = await givenIndicateurAvecValeur(Visibilite.PRIVE)

      const output = await runToolAs(
        randomUUID(),
        'get_synthese_indicateur',
        getSyntheseIndicateur,
        {
          indicateurId: indicateur.publicId,
          individuId: individu.publicId,
        },
      )

      expect(output).toEqual(
        expect.objectContaining({
          indicateur: null,
          individus: [],
          notFound: [indicateur.publicId],
        }),
      )
    }),
  )

  it(
    'demande une précision sans individu ni périmètre',
    integrationTest(async () => {
      const { indicateur } = await givenIndicateurAvecValeur(Visibilite.PUBLIC)

      const output = await runToolAs(
        randomUUID(),
        'get_synthese_indicateur',
        getSyntheseIndicateur,
        {
          indicateurId: indicateur.publicId,
        },
      )

      expect(output).toEqual(
        expect.objectContaining({ individus: [], needsClarification: expect.any(String) }),
      )
    }),
  )

  it(
    'rend des libellés, jamais des codes d’unité',
    integrationTest(async () => {
      const { indicateur, individu } = await givenIndicateurAvecValeur(Visibilite.PUBLIC)

      const output = await runToolAs(
        randomUUID(),
        'get_synthese_indicateur',
        getSyntheseIndicateur,
        {
          indicateurId: indicateur.publicId,
          individuId: individu.publicId,
        },
      )

      expect(JSON.stringify(output)).not.toContain('POURCENTAGE')
    }),
  )
})

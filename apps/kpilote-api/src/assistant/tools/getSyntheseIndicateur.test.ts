import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { getSyntheseIndicateur } from '@/assistant/tools/getSyntheseIndicateur'
import { UniteIndicateur, Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runToolAs } from '@/test/toolHarness'

const token = () => randomUUID().slice(0, 8)

const givenIndicateurAvecValeur = async (visibilite: Visibilite) => {
  const marqueur = token()
  const referentiel = await fixtures.referentiel({ nom: `Départements ${marqueur}` })
  const indicateur = await fixtures.indicateur({
    nom: `Chômage ${marqueur}`,
    visibilite,
    unite: UniteIndicateur.POURCENTAGE,
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

describe('get_synthese_indicateur', () => {
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

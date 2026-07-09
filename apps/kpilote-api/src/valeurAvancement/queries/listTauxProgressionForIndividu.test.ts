import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testIndicateurId,
  testIndicateurIds,
  testReferentielId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listTauxProgressionForIndividu } from '@/valeurAvancement/queries/listTauxProgressionForIndividu'

describe.concurrent('listTauxProgressionForIndividu', () => {
  it(
    'retourne le tauxProgression calculé quand un objectif est défini',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refA = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
        date: '2026-01-01',
        valeur: 75,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2026-12-01',
        valeurCible: 100,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndividu(deptId, { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            tauxProgression: 75,
            valeurCible: 100,
            dateCible: '2026-12-01',
          },
        ],
      })
    }),
  )

  it(
    'calcule le taux sur la dernière valeur de la série',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refA = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-03-01',
          valeur: 90,
        },
      )
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2026-12-01',
        valeurCible: 100,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndividu(deptId, { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            tauxProgression: 90,
            valeurCible: 100,
            dateCible: '2026-12-01',
          },
        ],
      })
    }),
  )

  it(
    'plafonne tauxProgression à 100 quand la valeur dépasse la cible',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refA = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
        date: '2026-01-01',
        valeur: 150,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2026-12-01',
        valeurCible: 100,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndividu(deptId, { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            tauxProgression: 100,
            valeurCible: 100,
            dateCible: '2026-12-01',
          },
        ],
      })
    }),
  )

  it(
    'retourne tauxProgression null et valeurCible 0 quand valeurCible vaut zéro',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refA = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
        date: '2026-01-01',
        valeur: 42,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2026-12-01',
        valeurCible: 0,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndividu(deptId, { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            tauxProgression: null,
            valeurCible: 0,
            dateCible: '2026-12-01',
          },
        ],
      })
    }),
  )

  it(
    'omet les indicateurs sans objectif défini',
    integrationTest(async () => {
      const [indAvecObjectif, indSansObjectif] = testIndicateurIds(2)
      const deptId = testDeptId()
      const refA = testReferentielId()
      await fixtures.indicateur(
        { publicId: indAvecObjectif, nom: 'A', visibilite: 'PUBLIC' },
        { publicId: indSansObjectif, nom: 'B', visibilite: 'PUBLIC' },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indAvecObjectif },
          individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indSansObjectif },
          individu: { publicId: deptId },
          date: '2026-01-01',
          valeur: 80,
        },
      )
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indAvecObjectif },
        individu: { publicId: deptId },
        dateCible: '2026-12-01',
        valeurCible: 100,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndividu(deptId, {
          indicateurs: [indAvecObjectif, indSansObjectif],
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indAvecObjectif,
            tauxProgression: 50,
            valeurCible: 100,
            dateCible: '2026-12-01',
          },
        ],
      })
    }),
  )

  it(
    "retourne items vide quand l'individu n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndividu('DEPT-99', { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )
})

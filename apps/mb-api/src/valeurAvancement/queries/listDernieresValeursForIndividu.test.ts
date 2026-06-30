import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testIndicateurId,
  testIndicateurIds,
  testReferentielId,
  testRegId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listDernieresValeursForIndividu } from '@/valeurAvancement/queries/listDernieresValeursForIndividu'

describe.concurrent('listDernieresValeursForIndividu', () => {
  it(
    "retourne la dernière valeur saisie d'un individu pour un indicateur",
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
          valeur: 75,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-02-01',
          valeur: 25,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDernieresValeursForIndividu(deptId, { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            valeur: 75,
            date: '2026-03-01',
            type: 'saisie',
          },
        ],
      })
    }),
  )

  it(
    "omet l'indicateur si l'individu n'a aucune valeur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refA = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.individu({ publicId: deptId, referentiel: { publicId: refA, nom: 'A' } })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDernieresValeursForIndividu(deptId, { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    "retourne items vide quand l'individu n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDernieresValeursForIndividu('DEPT-99', { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    "n'inclut que les indicateurs ayant au moins une valeur pour l'individu",
    integrationTest(async () => {
      const [indAvecValeur, indSansValeur] = testIndicateurIds(2)
      const deptId = testDeptId()
      const refA = testReferentielId()
      await fixtures.indicateur(
        { publicId: indAvecValeur, nom: 'A', visibilite: 'PUBLIC' },
        { publicId: indSansValeur, nom: 'B', visibilite: 'PUBLIC' },
      )
      await fixtures.valeurAvancement({
        indicateur: { publicId: indAvecValeur },
        individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
        date: '2026-01-01',
        valeur: 42,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDernieresValeursForIndividu(deptId, {
          indicateurs: [indAvecValeur, indSansValeur],
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indAvecValeur,
            valeur: 42,
            date: '2026-01-01',
            type: 'saisie',
          },
        ],
      })
    }),
  )

  it(
    'omet les indicateurs inaccessibles en lecture',
    integrationTest(async () => {
      const [indPublic, indPrive] = testIndicateurIds(2)
      const deptId = testDeptId()
      const refA = testReferentielId()
      await fixtures.indicateur(
        { publicId: indPublic, nom: 'Public', visibilite: 'PUBLIC' },
        { publicId: indPrive, nom: 'Privé', visibilite: 'PRIVE' },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indPublic },
          individu: { publicId: deptId, referentiel: { publicId: refA, nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indPrive },
          individu: { publicId: deptId },
          date: '2026-01-01',
          valeur: 99,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDernieresValeursForIndividu(deptId, { indicateurs: [indPublic, indPrive] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indPublic,
            valeur: 10,
            date: '2026-01-01',
            type: 'saisie',
          },
        ],
      })
    }),
  )

  it(
    'retourne type=derivee pour un individu agrégé sur des enfants ayant des valeurs',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const regId = testRegId()
      const deptId = testDeptId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refReg, nom: 'Régions' },
        fonctionAgregation: 'SUM',
      })
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refDept, nom: 'Départements' },
      })
      await fixtures.relation({
        parent: { publicId: regId, referentiel: { publicId: refReg } },
        child: { publicId: deptId, referentiel: { publicId: refDept } },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        date: '2026-01-15',
        valeur: 12,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDernieresValeursForIndividu(regId, { indicateurs: [indId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            valeur: 12,
            date: '2026-01-01',
            type: 'derivee',
          },
        ],
      })
    }),
  )
})

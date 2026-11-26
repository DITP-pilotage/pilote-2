import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testDeptIds,
  testIndicateurId,
  testIndicateurIds,
  testIndividuId,
  testReferentielId,
  testReferentielIds,
  testRegId,
  testRegIds,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listDernieresValeurs } from '@/valeurAvancement/queries/listDernieresValeurs'

describe.concurrent('listDernieresValeurs', () => {
  describe.concurrent('avec une sélection', () => {
    it(
      "lit chaque indicateur sur l'individu sélectionné de ses référentiels",
      integrationTest(async () => {
        const [indTerritorial, indBassin] = testIndicateurIds(2)
        const deptId = testDeptId()
        const bassinId = testIndividuId()
        const [refDept, refBassin] = testReferentielIds(2)
        await fixtures.indicateur(
          { publicId: indTerritorial, nom: 'Territorial', visibilite: 'PUBLIC' },
          { publicId: indBassin, nom: 'Bassin', visibilite: 'PUBLIC' },
        )
        await fixtures.indicateurReferentiel(
          {
            indicateur: { publicId: indTerritorial },
            referentiel: { publicId: refDept, nom: 'D' },
          },
          { indicateur: { publicId: indBassin }, referentiel: { publicId: refBassin, nom: 'B' } },
        )
        await fixtures.valeurAvancement(
          {
            indicateur: { publicId: indTerritorial },
            individu: { publicId: deptId, referentiel: { publicId: refDept } },
            date: '2026-01-01',
            valeur: 3,
          },
          {
            indicateur: { publicId: indBassin },
            individu: { publicId: bassinId, referentiel: { publicId: refBassin } },
            date: '2026-01-01',
            valeur: 4,
          },
        )
        const apiKey = await fixtures.apiKey()

        const result = await runAsPrincipal(apiKey.id, () =>
          listDernieresValeurs({
            query: {
              indicateurs: [indTerritorial, indBassin],
              individus: [deptId, bassinId],
            },
          }),
        )

        expect(result._unsafeUnwrap().items).toEqual(
          expect.arrayContaining([
            {
              indicateur: indTerritorial,
              individu: deptId,
              valeur: 3,
              date: '2026-01-01',
              type: 'saisie',
            },
            {
              indicateur: indBassin,
              individu: bassinId,
              valeur: 4,
              date: '2026-01-01',
              type: 'saisie',
            },
          ]),
        )
        expect(result._unsafeUnwrap().items).toHaveLength(2)
      }),
    )

    it(
      "omet un indicateur qu'aucun individu sélectionné ne concerne, sans remonter à un ancêtre",
      integrationTest(async () => {
        const indId = testIndicateurId()
        const regId = testRegId()
        const deptId = testDeptId()
        const [refReg, refDept] = testReferentielIds(2)
        await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
        await fixtures.indicateurReferentiel({
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg, nom: 'Rég.' },
        })
        await fixtures.relation({
          parent: { publicId: regId, referentiel: { publicId: refReg } },
          child: { publicId: deptId, referentiel: { publicId: refDept, nom: 'Dép.' } },
        })
        await fixtures.valeurAvancement({
          indicateur: { publicId: indId },
          individu: { publicId: regId },
          date: '2026-01-01',
          valeur: 9,
        })
        const apiKey = await fixtures.apiKey()

        const result = await runAsPrincipal(apiKey.id, () =>
          listDernieresValeurs({ query: { indicateurs: [indId], individus: [deptId] } }),
        )

        expect(result._unsafeUnwrap()).toEqual({ items: [] })
      }),
    )

    it(
      "prend le premier individu sélectionné quand plusieurs s'appliquent",
      integrationTest(async () => {
        const indId = testIndicateurId()
        const [premierId, secondId] = testDeptIds(2)
        const refDept = testReferentielId()
        await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
        await fixtures.indicateurReferentiel({
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept, nom: 'Dép.' },
        })
        await fixtures.valeurAvancement(
          {
            indicateur: { publicId: indId },
            individu: { publicId: premierId, referentiel: { publicId: refDept } },
            date: '2026-01-01',
            valeur: 1,
          },
          {
            indicateur: { publicId: indId },
            individu: { publicId: secondId, referentiel: { publicId: refDept } },
            date: '2026-01-01',
            valeur: 2,
          },
        )
        const apiKey = await fixtures.apiKey()

        const result = await runAsPrincipal(apiKey.id, () =>
          listDernieresValeurs({
            query: { indicateurs: [indId], individus: [secondId, premierId] },
          }),
        )

        expect(result._unsafeUnwrap().items).toEqual([
          expect.objectContaining({ indicateur: indId, individu: secondId, valeur: 2 }),
        ])
      }),
    )

    it(
      'lève une erreur quand un individu sélectionné est inconnu',
      integrationTest(async () => {
        const indId = testIndicateurId()
        const deptId = testDeptId()
        await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
        await fixtures.individu({ publicId: deptId })
        const apiKey = await fixtures.apiKey()

        await expect(
          runAsPrincipal(apiKey.id, () =>
            listDernieresValeurs({
              query: { indicateurs: [indId], individus: [deptId, 'DEPT-99'] },
            }),
          ),
        ).rejects.toThrow('Individus introuvables')
      }),
    )
  })

  describe.concurrent('sans sélection', () => {
    it(
      "lit l'indicateur sur la racine de l'ensemble de ses référentiels liés",
      integrationTest(async () => {
        const indId = testIndicateurId()
        const franceId = testIndividuId()
        const bretagneId = testRegId()
        const finistereId = testDeptId()
        const [refNat, refReg, refDept] = testReferentielIds(3)
        await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
        // Liés dans l'ordre inverse de la hiérarchie : l'ordre des liens ne compte pas.
        await fixtures.indicateurReferentiel(
          { indicateur: { publicId: indId }, referentiel: { publicId: refDept, nom: 'Dép.' } },
          { indicateur: { publicId: indId }, referentiel: { publicId: refReg, nom: 'Rég.' } },
          { indicateur: { publicId: indId }, referentiel: { publicId: refNat, nom: 'Nat.' } },
        )
        await fixtures.relation(
          {
            parent: { publicId: franceId, nom: 'France', referentiel: { publicId: refNat } },
            child: { publicId: bretagneId, nom: 'Bretagne', referentiel: { publicId: refReg } },
          },
          {
            parent: { publicId: bretagneId },
            child: { publicId: finistereId, nom: 'Finistère', referentiel: { publicId: refDept } },
          },
        )
        await fixtures.valeurAvancement({
          indicateur: { publicId: indId },
          individu: { publicId: finistereId },
          date: '2026-02-01',
          valeur: 12,
        })
        const apiKey = await fixtures.apiKey()

        const result = await runAsPrincipal(apiKey.id, () =>
          listDernieresValeurs({ query: { indicateurs: [indId] } }),
        )

        expect(result._unsafeUnwrap()).toEqual({
          items: [
            {
              indicateur: indId,
              individu: franceId,
              valeur: 12,
              date: '2026-02-01',
              type: 'derivee',
            },
          ],
        })
      }),
    )

    it(
      "ignore un parent hors des référentiels liés à l'indicateur",
      integrationTest(async () => {
        const indId = testIndicateurId()
        const franceId = testIndividuId()
        const bretagneId = testRegId()
        const [refNat, refReg] = testReferentielIds(2)
        await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
        await fixtures.indicateurReferentiel({
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg, nom: 'Rég.' },
        })
        await fixtures.relation({
          parent: { publicId: franceId, nom: 'France', referentiel: { publicId: refNat } },
          child: { publicId: bretagneId, nom: 'Bretagne', referentiel: { publicId: refReg } },
        })
        await fixtures.valeurAvancement({
          indicateur: { publicId: indId },
          individu: { publicId: bretagneId },
          date: '2026-01-01',
          valeur: 7,
        })
        const apiKey = await fixtures.apiKey()

        const result = await runAsPrincipal(apiKey.id, () =>
          listDernieresValeurs({ query: { indicateurs: [indId] } }),
        )

        expect(result._unsafeUnwrap().items).toEqual([
          expect.objectContaining({ indicateur: indId, individu: bretagneId, valeur: 7 }),
        ])
      }),
    )

    it(
      'prend la première racine par nom quand il y en a plusieurs',
      integrationTest(async () => {
        const indId = testIndicateurId()
        const [bretagneId, alsaceId] = testRegIds(2)
        const refReg = testReferentielId()
        await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
        await fixtures.indicateurReferentiel({
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg, nom: 'Rég.' },
        })
        await fixtures.valeurAvancement(
          {
            indicateur: { publicId: indId },
            individu: { publicId: bretagneId, nom: 'Bretagne', referentiel: { publicId: refReg } },
            date: '2026-01-01',
            valeur: 1,
          },
          {
            indicateur: { publicId: indId },
            individu: { publicId: alsaceId, nom: 'Alsace', referentiel: { publicId: refReg } },
            date: '2026-01-01',
            valeur: 2,
          },
        )
        const apiKey = await fixtures.apiKey()

        const result = await runAsPrincipal(apiKey.id, () =>
          listDernieresValeurs({ query: { indicateurs: [indId] } }),
        )

        expect(result._unsafeUnwrap().items).toEqual([
          expect.objectContaining({ indicateur: indId, individu: alsaceId, valeur: 2 }),
        ])
      }),
    )

    it(
      'lit chaque indicateur du lot sur sa propre racine',
      integrationTest(async () => {
        const [indRegional, indBassin] = testIndicateurIds(2)
        const regId = testRegId()
        const bassinId = testIndividuId()
        const [refReg, refBassin] = testReferentielIds(2)
        await fixtures.indicateur(
          { publicId: indRegional, nom: 'Régional', visibilite: 'PUBLIC' },
          { publicId: indBassin, nom: 'Bassin', visibilite: 'PUBLIC' },
        )
        await fixtures.indicateurReferentiel(
          { indicateur: { publicId: indRegional }, referentiel: { publicId: refReg, nom: 'R' } },
          { indicateur: { publicId: indBassin }, referentiel: { publicId: refBassin, nom: 'B' } },
        )
        await fixtures.valeurAvancement(
          {
            indicateur: { publicId: indRegional },
            individu: { publicId: regId, referentiel: { publicId: refReg } },
            date: '2026-01-01',
            valeur: 3,
          },
          {
            indicateur: { publicId: indBassin },
            individu: { publicId: bassinId, referentiel: { publicId: refBassin } },
            date: '2026-01-01',
            valeur: 4,
          },
        )
        const apiKey = await fixtures.apiKey()

        const result = await runAsPrincipal(apiKey.id, () =>
          listDernieresValeurs({ query: { indicateurs: [indRegional, indBassin] } }),
        )

        expect(result._unsafeUnwrap().items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ indicateur: indRegional, individu: regId, valeur: 3 }),
            expect.objectContaining({ indicateur: indBassin, individu: bassinId, valeur: 4 }),
          ]),
        )
      }),
    )

    it(
      'omet un indicateur sans référentiel lié',
      integrationTest(async () => {
        const indId = testIndicateurId()
        await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
        const apiKey = await fixtures.apiKey()

        const result = await runAsPrincipal(apiKey.id, () =>
          listDernieresValeurs({ query: { indicateurs: [indId] } }),
        )

        expect(result._unsafeUnwrap()).toEqual({ items: [] })
      }),
    )
  })
})

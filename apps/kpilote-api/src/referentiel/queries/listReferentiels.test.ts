import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import { listReferentiels } from '@/referentiel/queries/listReferentiels'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testIndicateurId,
  testIndividuId,
  testPanierId,
  testReferentielId,
  testWidgetId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listReferentiels', () => {
  it(
    "retourne une liste vide quand aucun référentiel n'existe",
    integrationTest(async () => {
      const result = await listReferentiels({})

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    "retourne les référentiels avec leur nombre d'individus",
    integrationTest(async () => {
      const refAlpha = testReferentielId()
      const refBeta = testReferentielId()
      const a1 = testIndividuId()
      const a2 = testIndividuId()
      await fixtures.individu(
        {
          publicId: a1,
          referentiel: { publicId: refAlpha, nom: 'Alpha' },
        },
        {
          publicId: a2,
          referentiel: { publicId: refAlpha },
        },
      )
      await fixtures.referentiel({ publicId: refBeta, nom: 'Beta' })

      const result = await listReferentiels({})

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: refAlpha,
            nom: 'Alpha',
            description: null,
            nombreIndividus: 2,
            widgets: [],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          {
            id: refBeta,
            nom: 'Beta',
            description: null,
            nombreIndividus: 0,
            widgets: [],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        ],
        pagination: { cursor: null, hasMore: false },
        total: 2,
      })
    }),
  )

  it(
    'inclut les widgets rattachés à chaque référentiel',
    integrationTest(async () => {
      const refWidList = testReferentielId()
      const widCartoList = testWidgetId()
      await fixtures.referentielWidget({
        referentiel: { publicId: refWidList, nom: 'Référentiel avec widget' },
        widget: {
          publicId: widCartoList,
          type: 'carte-france-departements',
          nom: 'Carte des départements',
          joinKey: 'codeInsee',
        },
      })

      const result = await listReferentiels({ recherche: 'avec widget' })

      expect(result._unsafeUnwrap().items).toEqual([
        expect.objectContaining({
          id: refWidList,
          widgets: [
            {
              id: widCartoList,
              type: 'carte-france-departements',
              nom: 'Carte des départements',
              joinKey: 'codeInsee',
            },
          ],
        }),
      ])
    }),
  )

  it(
    'filtre par recherche case-insensitive',
    integrationTest(async () => {
      const refDept = testReferentielId()
      const refReg = testReferentielId()
      const refNat = testReferentielId()
      await fixtures.referentiel(
        { publicId: refDept, nom: 'Départements de France' },
        { publicId: refReg, nom: 'Régions de France' },
        { publicId: refNat, nom: 'France national' },
      )

      const result = await listReferentiels({ recherche: 'régions' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: refReg,
            nom: 'Régions de France',
            description: null,
            nombreIndividus: 0,
            widgets: [],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        ],
        pagination: { cursor: null, hasMore: false },
        total: 1,
      })
    }),
  )

  it(
    'pagine au-delà de la taille de page',
    integrationTest(async () => {
      const ref1 = testReferentielId()
      const ref2 = testReferentielId()
      const ref3 = testReferentielId()
      const ref4 = testReferentielId()
      const ref5 = testReferentielId()
      const ref6 = testReferentielId()
      const created = await fixtures.referentiel(
        { publicId: ref1, nom: 'R1' },
        { publicId: ref2, nom: 'R2' },
        { publicId: ref3, nom: 'R3' },
        { publicId: ref4, nom: 'R4' },
        { publicId: ref5, nom: 'R5' },
        { publicId: ref6, nom: 'R6' },
      )

      const result = await listReferentiels({ pageSize: 5 })

      const value = result._unsafeUnwrap()
      expect(value.items).toHaveLength(5)
      expect(value.items.map((r) => r.id)).toEqual([ref1, ref2, ref3, ref4, ref5])
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'scope=me ne renvoie que les référentiels reliés à un indicateur lisible',
    integrationTest(async () => {
      const refAvec = testReferentielId()
      const refSans = testReferentielId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: testIndicateurId(), visibilite: 'PUBLIC' },
        referentiel: { publicId: refAvec, nom: 'Avec' },
      })
      await fixtures.referentiel({ publicId: refSans, nom: 'Sans' })

      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () => listReferentiels({ scope: 'me' }))

      const ids = result._unsafeUnwrap().items.map((r) => r.id)
      expect(ids).toContain(refAvec)
      expect(ids).not.toContain(refSans)
    }),
  )

  it(
    "scope=me exclut les référentiels dont l'indicateur n'est pas lisible par le principal",
    integrationTest(async () => {
      const refPrive = testReferentielId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: testIndicateurId(), visibilite: 'PRIVE' },
        referentiel: { publicId: refPrive, nom: 'Privé' },
      })

      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () => listReferentiels({ scope: 'me' }))

      expect(result._unsafeUnwrap().items.map((r) => r.id)).not.toContain(refPrive)
    }),
  )

  it(
    'scope=panier renvoie les référentiels des indicateurs du panier',
    integrationTest(async () => {
      const refDuPanier = testReferentielId()
      const refHorsPanier = testReferentielId()
      const indicateurPublicId = testIndicateurId()
      const panierPublicId = testPanierId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indicateurPublicId, visibilite: 'PUBLIC' },
        referentiel: { publicId: refDuPanier, nom: 'Dans le panier' },
      })
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: testIndicateurId(), visibilite: 'PUBLIC' },
        referentiel: { publicId: refHorsPanier, nom: 'Hors panier' },
      })
      await fixtures.panier({
        publicId: panierPublicId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indicateurPublicId }],
      })

      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () =>
        listReferentiels({ scope: `panier:${panierPublicId}` }),
      )

      const ids = result._unsafeUnwrap().items.map((r) => r.id)
      expect(ids).toContain(refDuPanier)
      expect(ids).not.toContain(refHorsPanier)
    }),
  )
})

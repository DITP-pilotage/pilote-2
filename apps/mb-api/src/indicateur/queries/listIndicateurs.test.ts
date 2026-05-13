import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { encodeCursor } from '@/framework/persistence/paginate'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listIndicateurs', () => {
  it(
    "retourne une liste vide quand aucun indicateur n'existe",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    "n'inclut que les indicateurs sur lesquels le principal a une permission",
    integrationTest(async () => {
      const [accessible, hidden] = testIndicateurIds(2)
      await fixtures.indicateur({ publicId: accessible }, { publicId: hidden })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: accessible }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([accessible])
      expect(value.total).toBe(1)
    }),
  )

  it(
    'retourne tous les indicateurs autorisés quand leur nombre est inférieur à la taille de page',
    integrationTest(async () => {
      const [ind1, ind2, ind3] = testIndicateurIds(3)
      await fixtures.indicateur(
        { publicId: ind1, nom: 'Alpha' },
        { publicId: ind2, nom: 'Bravo' },
        { publicId: ind3, nom: 'Charlie' },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: ind1 }, action: 'READ' },
          { indicateur: { publicId: ind2 }, action: 'READ' },
          { indicateur: { publicId: ind3 }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([ind1, ind2, ind3])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "pagine quand le nombre d'indicateurs dépasse la taille de page",
    integrationTest(async () => {
      const ids = testIndicateurIds(6)
      const created = await fixtures.indicateur(
        { publicId: ids[0] },
        { publicId: ids[1] },
        { publicId: ids[2] },
        { publicId: ids[3] },
        { publicId: ids[4] },
        { publicId: ids[5] },
      )
      const apiKey = await fixtures.apiKey({
        permissions: ids.map((publicId) => ({
          indicateur: { publicId },
          action: 'READ' as const,
        })),
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({ pageSize: 5 }))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(ids.slice(0, 5))
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'retourne la page suivante en utilisant le cursor',
    integrationTest(async () => {
      const ids = testIndicateurIds(6)
      const created = await fixtures.indicateur(
        { publicId: ids[0] },
        { publicId: ids[1] },
        { publicId: ids[2] },
        { publicId: ids[3] },
        { publicId: ids[4] },
        { publicId: ids[5] },
      )
      const apiKey = await fixtures.apiKey({
        permissions: ids.map((publicId) => ({
          indicateur: { publicId },
          action: 'READ' as const,
        })),
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndicateurs({ cursor: encodeCursor(created[4]!.id) }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([ids[5]])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'filtre les indicateurs par recherche de manière case-insensitive',
    integrationTest(async () => {
      const [ind1, ind2, ind3] = testIndicateurIds(3)
      await fixtures.indicateur(
        { publicId: ind1, nom: 'Taux de satisfaction' },
        { publicId: ind2, nom: 'Délai moyen' },
        { publicId: ind3, nom: 'SATISFACTION client' },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: ind1 }, action: 'READ' },
          { indicateur: { publicId: ind2 }, action: 'READ' },
          { indicateur: { publicId: ind3 }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndicateurs({ recherche: 'satisfaction' }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([ind1, ind3])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(2)
    }),
  )

  it(
    'combine la recherche et la pagination',
    integrationTest(async () => {
      const ids = testIndicateurIds(7)
      const created = await fixtures.indicateur(
        { publicId: ids[0], nom: 'Satisfaction 1' },
        { publicId: ids[1], nom: 'Satisfaction 2' },
        { publicId: ids[2], nom: 'Satisfaction 3' },
        { publicId: ids[3], nom: 'Satisfaction 4' },
        { publicId: ids[4], nom: 'Satisfaction 5' },
        { publicId: ids[5], nom: 'Satisfaction 6' },
        { publicId: ids[6], nom: 'Délai moyen' },
      )
      const apiKey = await fixtures.apiKey({
        permissions: ids.map((publicId) => ({
          indicateur: { publicId },
          action: 'READ' as const,
        })),
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndicateurs({ recherche: 'satisfaction', pageSize: 5 }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(ids.slice(0, 5))
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'expose referentielIds triés par publicId ASC sur chaque item',
    integrationTest(async () => {
      const [accessible] = testIndicateurIds(1)
      const indicateur = await fixtures.indicateur({ publicId: accessible })
      const [refA, refB] = await fixtures.referentiel(
        { publicId: 'REF-LIST-Z' },
        { publicId: 'REF-LIST-M' },
      )
      await db().indicateurReferentiel.createMany({
        data: [
          { indicateurId: indicateur.id, referentielId: refA!.id },
          { indicateurId: indicateur.id, referentielId: refB!.id },
        ],
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: accessible }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const value = result._unsafeUnwrap()
      expect(value.items.find((i) => i.id === accessible)?.referentielIds).toEqual([
        'REF-LIST-M',
        'REF-LIST-Z',
      ])
    }),
  )
})

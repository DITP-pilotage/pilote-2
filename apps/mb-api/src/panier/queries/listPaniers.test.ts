import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import { listPaniers } from '@/panier/queries/listPaniers'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testPanierId } from '@/test/randomIds'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listPaniers', () => {
  it(
    "retourne une liste vide quand aucun panier n'existe",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    'retourne tous les paniers PUBLIC quand leur nombre est inférieur à la taille de page',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const panList1 = testPanierId()
      const panList2 = testPanierId()
      const panList3 = testPanierId()
      await fixtures.panier(
        { publicId: panList1, nom: 'Panier 1', visibilite: 'PUBLIC' },
        { publicId: panList2, nom: 'Panier 2', visibilite: 'PUBLIC' },
        { publicId: panList3, nom: 'Panier 3', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panList1, panList2, panList3])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "n'inclut que les paniers sur lesquels le principal a une permission",
    integrationTest(async () => {
      const panPermAcc = testPanierId()
      const panPermHid = testPanierId()
      await fixtures.panier(
        { publicId: panPermAcc, visibilite: 'PRIVE' },
        { publicId: panPermHid, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panPermAcc }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panPermAcc])
      expect(value.total).toBe(1)
    }),
  )

  it(
    "inclut les paniers PUBLIC sur lesquels le principal n'a aucune permission",
    integrationTest(async () => {
      const panVisPub = testPanierId()
      const panVisPri = testPanierId()
      await fixtures.panier(
        { publicId: panVisPub, visibilite: 'PUBLIC' },
        { publicId: panVisPri, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panVisPub])
      expect(value.items.map((p) => p.visibilite)).toEqual(['PUBLIC'])
    }),
  )

  it(
    "expose les indicateurs du panier triés par ordre d'insertion (createdAt ASC)",
    integrationTest(async () => {
      const [indA, indB, indC] = testIndicateurIds(3)
      const panOrder = testPanierId()
      await fixtures.panier({
        publicId: panOrder,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }, { publicId: indC }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      const panier = value.items.find((p) => p.id === panOrder)
      expect(panier?.indicateurIds).toEqual([indA, indB, indC])
    }),
  )

  it(
    'retourne un panier sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      const panEmpty = testPanierId()
      await fixtures.panier({ publicId: panEmpty, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      const value = result._unsafeUnwrap()
      const panier = value.items.find((p) => p.id === panEmpty)
      expect(panier?.indicateurIds).toEqual([])
    }),
  )

  it(
    'pagine quand le nombre de paniers dépasse la taille de page',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const panPage1 = testPanierId()
      const panPage2 = testPanierId()
      const panPage3 = testPanierId()
      const panPage4 = testPanierId()
      const panPage5 = testPanierId()
      const panPage6 = testPanierId()
      const created = await fixtures.panier(
        { publicId: panPage1, visibilite: 'PUBLIC' },
        { publicId: panPage2, visibilite: 'PUBLIC' },
        { publicId: panPage3, visibilite: 'PUBLIC' },
        { publicId: panPage4, visibilite: 'PUBLIC' },
        { publicId: panPage5, visibilite: 'PUBLIC' },
        { publicId: panPage6, visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({ pageSize: 5 }))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([
        panPage1,
        panPage2,
        panPage3,
        panPage4,
        panPage5,
      ])
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'retourne la page suivante en utilisant le cursor',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const panCursor1 = testPanierId()
      const panCursor2 = testPanierId()
      const panCursor3 = testPanierId()
      const panCursor4 = testPanierId()
      const panCursor5 = testPanierId()
      const panCursor6 = testPanierId()
      const created = await fixtures.panier(
        { publicId: panCursor1, visibilite: 'PUBLIC' },
        { publicId: panCursor2, visibilite: 'PUBLIC' },
        { publicId: panCursor3, visibilite: 'PUBLIC' },
        { publicId: panCursor4, visibilite: 'PUBLIC' },
        { publicId: panCursor5, visibilite: 'PUBLIC' },
        { publicId: panCursor6, visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPaniers({ cursor: encodeCursor(created[4]!.id) }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panCursor6])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'un principal ADMIN voit les paniers PRIVÉ sans permission explicite',
    integrationTest(async () => {
      const pubId = testPanierId()
      await fixtures.panier({ publicId: pubId, visibilite: 'PRIVE' })

      const result = await runAsAdmin('00000000-0000-0000-0000-0000000000a1', () => listPaniers({}))

      expect(result._unsafeUnwrap().items.map((p) => p.id)).toContain(pubId)
    }),
  )

  it(
    'un principal non-ADMIN ne voit pas un panier PRIVÉ sans permission',
    integrationTest(async () => {
      const pubId = testPanierId()
      await fixtures.panier({ publicId: pubId, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listPaniers({}))

      expect(result._unsafeUnwrap().items.map((p) => p.id)).not.toContain(pubId)
    }),
  )

  it(
    'filtre les paniers par recherche sur le nom',
    integrationTest(async () => {
      const match = testPanierId()
      const other = testPanierId()
      await fixtures.panier({ publicId: match, nom: 'Logement social', visibilite: 'PRIVE' })
      await fixtures.panier({ publicId: other, nom: 'Transport', visibilite: 'PRIVE' })

      const result = await runAsAdmin('00000000-0000-0000-0000-0000000000a1', () =>
        listPaniers({ recherche: 'logement' }),
      )
      const ids = result._unsafeUnwrap().items.map((p) => p.id)

      expect(ids).toContain(match)
      expect(ids).not.toContain(other)
    }),
  )
})

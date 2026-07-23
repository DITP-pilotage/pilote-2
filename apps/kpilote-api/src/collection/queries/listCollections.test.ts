import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import { listCollections } from '@/collection/queries/listCollections'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testCollectionId } from '@/test/randomIds'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listCollections', () => {
  it(
    "retourne une liste vide quand aucune collection n'existe",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    'retourne toutes les collections PUBLIC quand leur nombre est inférieur à la taille de page',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const dosList1 = testCollectionId()
      const dosList2 = testCollectionId()
      const dosList3 = testCollectionId()
      await fixtures.collection(
        { publicId: dosList1, nom: 'Collection 1', visibilite: 'PUBLIC' },
        { publicId: dosList2, nom: 'Collection 2', visibilite: 'PUBLIC' },
        { publicId: dosList3, nom: 'Collection 3', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([dosList1, dosList2, dosList3])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "n'inclut que les collections sur lesquels le principal a une permission",
    integrationTest(async () => {
      const panPermAcc = testCollectionId()
      const panPermHid = testCollectionId()
      await fixtures.collection(
        { publicId: panPermAcc, visibilite: 'PRIVE' },
        { publicId: panPermHid, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [{ collection: { publicId: panPermAcc }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panPermAcc])
      expect(value.total).toBe(1)
    }),
  )

  it(
    "inclut les collections PUBLIC sur lesquels le principal n'a aucune permission",
    integrationTest(async () => {
      const panVisPub = testCollectionId()
      const panVisPri = testCollectionId()
      await fixtures.collection(
        { publicId: panVisPub, visibilite: 'PUBLIC' },
        { publicId: panVisPri, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panVisPub])
      expect(value.items.map((p) => p.visibilite)).toEqual(['PUBLIC'])
    }),
  )

  it(
    "expose les indicateurs de la collection triés par ordre d'insertion (createdAt ASC)",
    integrationTest(async () => {
      const [indA, indB, indC] = testIndicateurIds(3)
      const dosOrder = testCollectionId()
      await fixtures.collection({
        publicId: dosOrder,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }, { publicId: indC }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      const collection = value.items.find((p) => p.id === dosOrder)
      expect(collection?.indicateurIds).toEqual([indA, indB, indC])
    }),
  )

  it(
    'retourne une collection sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      const dosEmpty = testCollectionId()
      await fixtures.collection({ publicId: dosEmpty, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      const collection = value.items.find((p) => p.id === dosEmpty)
      expect(collection?.indicateurIds).toEqual([])
    }),
  )

  it(
    'pagine quand le nombre de collections dépasse la taille de page',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const panPage1 = testCollectionId()
      const panPage2 = testCollectionId()
      const panPage3 = testCollectionId()
      const panPage4 = testCollectionId()
      const panPage5 = testCollectionId()
      const panPage6 = testCollectionId()
      const created = await fixtures.collection(
        { publicId: panPage1, visibilite: 'PUBLIC' },
        { publicId: panPage2, visibilite: 'PUBLIC' },
        { publicId: panPage3, visibilite: 'PUBLIC' },
        { publicId: panPage4, visibilite: 'PUBLIC' },
        { publicId: panPage5, visibilite: 'PUBLIC' },
        { publicId: panPage6, visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({ pageSize: 5 }))

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
      const panCursor1 = testCollectionId()
      const panCursor2 = testCollectionId()
      const panCursor3 = testCollectionId()
      const panCursor4 = testCollectionId()
      const panCursor5 = testCollectionId()
      const panCursor6 = testCollectionId()
      const created = await fixtures.collection(
        { publicId: panCursor1, visibilite: 'PUBLIC' },
        { publicId: panCursor2, visibilite: 'PUBLIC' },
        { publicId: panCursor3, visibilite: 'PUBLIC' },
        { publicId: panCursor4, visibilite: 'PUBLIC' },
        { publicId: panCursor5, visibilite: 'PUBLIC' },
        { publicId: panCursor6, visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollections({ cursor: encodeCursor(created[4]!.id) }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panCursor6])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'un principal ADMIN voit les collections PRIVÉ sans permission explicite',
    integrationTest(async () => {
      const pubId = testCollectionId()
      await fixtures.collection({ publicId: pubId, visibilite: 'PRIVE' })

      const result = await runAsAdmin('00000000-0000-0000-0000-0000000000a1', () =>
        listCollections({}),
      )

      expect(result._unsafeUnwrap().items.map((p) => p.id)).toContain(pubId)
    }),
  )

  it(
    'un principal non-ADMIN ne voit pas une collection PRIVÉ sans permission',
    integrationTest(async () => {
      const pubId = testCollectionId()
      await fixtures.collection({ publicId: pubId, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      expect(result._unsafeUnwrap().items.map((p) => p.id)).not.toContain(pubId)
    }),
  )

  it(
    'filtre les collections par recherche sur le nom',
    integrationTest(async () => {
      const match = testCollectionId()
      const other = testCollectionId()
      await fixtures.collection({ publicId: match, nom: 'Logement social', visibilite: 'PRIVE' })
      await fixtures.collection({ publicId: other, nom: 'Transport', visibilite: 'PRIVE' })

      const result = await runAsAdmin('00000000-0000-0000-0000-0000000000a1', () =>
        listCollections({ recherche: 'logement' }),
      )
      const ids = result._unsafeUnwrap().items.map((p) => p.id)

      expect(ids).toContain(match)
      expect(ids).not.toContain(other)
    }),
  )

  it(
    "filtre les collections par recherche sur l'identifiant public",
    integrationTest(async () => {
      const match = testCollectionId()
      const other = testCollectionId()
      await fixtures.collection({ publicId: match, nom: 'Alpha', visibilite: 'PRIVE' })
      await fixtures.collection({ publicId: other, nom: 'Beta', visibilite: 'PRIVE' })

      const result = await runAsAdmin('00000000-0000-0000-0000-0000000000a1', () =>
        listCollections({ rechercheIdentifiant: match }),
      )
      const ids = result._unsafeUnwrap().items.map((p) => p.id)

      expect(ids).toContain(match)
      expect(ids).not.toContain(other)
    }),
  )
})

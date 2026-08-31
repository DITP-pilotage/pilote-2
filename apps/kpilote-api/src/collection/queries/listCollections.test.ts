import { CollectionPermissionAction } from '@/generated/prisma/enums'
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
      const colList1 = testCollectionId()
      const colList2 = testCollectionId()
      const colList3 = testCollectionId()
      await fixtures.collection(
        { publicId: colList1, nom: 'Collection 1', visibilite: 'PUBLIC' },
        { publicId: colList2, nom: 'Collection 2', visibilite: 'PUBLIC' },
        { publicId: colList3, nom: 'Collection 3', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([colList1, colList2, colList3])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "n'inclut que les collections sur lesquels le principal a une permission",
    integrationTest(async () => {
      const colPermAcc = testCollectionId()
      const colPermHid = testCollectionId()
      await fixtures.collection(
        { publicId: colPermAcc, visibilite: 'PRIVE' },
        { publicId: colPermHid, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey({
        collectionPermissions: [
          { collection: { publicId: colPermAcc }, action: CollectionPermissionAction.READ },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([colPermAcc])
      expect(value.total).toBe(1)
    }),
  )

  it(
    "inclut les collections PUBLIC sur lesquels le principal n'a aucune permission",
    integrationTest(async () => {
      const colVisPub = testCollectionId()
      const colVisPri = testCollectionId()
      await fixtures.collection(
        { publicId: colVisPub, visibilite: 'PUBLIC' },
        { publicId: colVisPri, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([colVisPub])
      expect(value.items.map((p) => p.visibilite)).toEqual(['PUBLIC'])
    }),
  )

  it(
    "expose les indicateurs de la collection triés par ordre d'insertion (createdAt ASC)",
    integrationTest(async () => {
      const [indA, indB, indC] = testIndicateurIds(3)
      const colOrder = testCollectionId()
      await fixtures.collection({
        publicId: colOrder,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }, { publicId: indC }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      const collection = value.items.find((p) => p.id === colOrder)
      expect(collection?.indicateurs).toEqual([
        { id: indA, ponderation: 1 },
        { id: indB, ponderation: 1 },
        { id: indC, ponderation: 1 },
      ])
    }),
  )

  it(
    'retourne une collection sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      const colEmpty = testCollectionId()
      await fixtures.collection({ publicId: colEmpty, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({}))

      const value = result._unsafeUnwrap()
      const collection = value.items.find((p) => p.id === colEmpty)
      expect(collection?.indicateurs).toEqual([])
    }),
  )

  it(
    'pagine quand le nombre de collections dépasse la taille de page',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const colPage1 = testCollectionId()
      const colPage2 = testCollectionId()
      const colPage3 = testCollectionId()
      const colPage4 = testCollectionId()
      const colPage5 = testCollectionId()
      const colPage6 = testCollectionId()
      const created = await fixtures.collection(
        { publicId: colPage1, visibilite: 'PUBLIC' },
        { publicId: colPage2, visibilite: 'PUBLIC' },
        { publicId: colPage3, visibilite: 'PUBLIC' },
        { publicId: colPage4, visibilite: 'PUBLIC' },
        { publicId: colPage5, visibilite: 'PUBLIC' },
        { publicId: colPage6, visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({ pageSize: 5 }))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([
        colPage1,
        colPage2,
        colPage3,
        colPage4,
        colPage5,
      ])
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'retourne la page suivante en utilisant le cursor',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const colCursor1 = testCollectionId()
      const colCursor2 = testCollectionId()
      const colCursor3 = testCollectionId()
      const colCursor4 = testCollectionId()
      const colCursor5 = testCollectionId()
      const colCursor6 = testCollectionId()
      const created = await fixtures.collection(
        { publicId: colCursor1, visibilite: 'PUBLIC' },
        { publicId: colCursor2, visibilite: 'PUBLIC' },
        { publicId: colCursor3, visibilite: 'PUBLIC' },
        { publicId: colCursor4, visibilite: 'PUBLIC' },
        { publicId: colCursor5, visibilite: 'PUBLIC' },
        { publicId: colCursor6, visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollections({ cursor: encodeCursor(created[4]!.id) }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([colCursor6])
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

  it(
    'filtre sur les identifiants publics fournis',
    integrationTest(async () => {
      const gardee = testCollectionId()
      const ignoree = testCollectionId()
      await fixtures.collection(
        { publicId: gardee, nom: 'Gardée', visibilite: 'PUBLIC' },
        { publicId: ignoree, nom: 'Ignorée', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({ ids: [gardee] }))

      // Le modèle d'API expose l'identifiant public sous `id` ; la fixture sous `publicId`.
      expect(result._unsafeUnwrap().items.map((item) => item.id)).toEqual([gardee])
    }),
  )

  it(
    'ignore un tableau ids vide plutôt que de tout filtrer',
    integrationTest(async () => {
      const presente = testCollectionId()
      await fixtures.collection({ publicId: presente, nom: 'Présente', visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listCollections({ ids: [] }))

      expect(result._unsafeUnwrap().items.map((item) => item.id)).toContain(presente)
    }),
  )
})

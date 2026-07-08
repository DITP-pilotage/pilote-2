import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import { listDossiers } from '@/dossier/queries/listDossiers'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testDossierId } from '@/test/randomIds'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listDossiers', () => {
  it(
    "retourne une liste vide quand aucun dossier n'existe",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () => listDossiers({}))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    'retourne tous les dossiers PUBLIC quand leur nombre est inférieur à la taille de page',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const dosList1 = testDossierId()
      const dosList2 = testDossierId()
      const dosList3 = testDossierId()
      await fixtures.dossier(
        { publicId: dosList1, nom: 'Dossier 1', visibilite: 'PUBLIC' },
        { publicId: dosList2, nom: 'Dossier 2', visibilite: 'PUBLIC' },
        { publicId: dosList3, nom: 'Dossier 3', visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listDossiers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([dosList1, dosList2, dosList3])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "n'inclut que les dossiers sur lesquels le principal a une permission",
    integrationTest(async () => {
      const panPermAcc = testDossierId()
      const panPermHid = testDossierId()
      await fixtures.dossier(
        { publicId: panPermAcc, visibilite: 'PRIVE' },
        { publicId: panPermHid, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: panPermAcc }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listDossiers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panPermAcc])
      expect(value.total).toBe(1)
    }),
  )

  it(
    "inclut les dossiers PUBLIC sur lesquels le principal n'a aucune permission",
    integrationTest(async () => {
      const panVisPub = testDossierId()
      const panVisPri = testDossierId()
      await fixtures.dossier(
        { publicId: panVisPub, visibilite: 'PUBLIC' },
        { publicId: panVisPri, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listDossiers({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panVisPub])
      expect(value.items.map((p) => p.visibilite)).toEqual(['PUBLIC'])
    }),
  )

  it(
    "expose les indicateurs du dossier triés par ordre d'insertion (createdAt ASC)",
    integrationTest(async () => {
      const [indA, indB, indC] = testIndicateurIds(3)
      const dosOrder = testDossierId()
      await fixtures.dossier({
        publicId: dosOrder,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }, { publicId: indC }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listDossiers({}))

      const value = result._unsafeUnwrap()
      const dossier = value.items.find((p) => p.id === dosOrder)
      expect(dossier?.indicateurIds).toEqual([indA, indB, indC])
    }),
  )

  it(
    'retourne un dossier sans indicateurs avec un tableau vide',
    integrationTest(async () => {
      const dosEmpty = testDossierId()
      await fixtures.dossier({ publicId: dosEmpty, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listDossiers({}))

      const value = result._unsafeUnwrap()
      const dossier = value.items.find((p) => p.id === dosEmpty)
      expect(dossier?.indicateurIds).toEqual([])
    }),
  )

  it(
    'pagine quand le nombre de dossiers dépasse la taille de page',
    integrationTest(async () => {
      // Ordre de création = ordre attendu (orderBy id interne uuidv7).
      const panPage1 = testDossierId()
      const panPage2 = testDossierId()
      const panPage3 = testDossierId()
      const panPage4 = testDossierId()
      const panPage5 = testDossierId()
      const panPage6 = testDossierId()
      const created = await fixtures.dossier(
        { publicId: panPage1, visibilite: 'PUBLIC' },
        { publicId: panPage2, visibilite: 'PUBLIC' },
        { publicId: panPage3, visibilite: 'PUBLIC' },
        { publicId: panPage4, visibilite: 'PUBLIC' },
        { publicId: panPage5, visibilite: 'PUBLIC' },
        { publicId: panPage6, visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listDossiers({ pageSize: 5 }))

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
      const panCursor1 = testDossierId()
      const panCursor2 = testDossierId()
      const panCursor3 = testDossierId()
      const panCursor4 = testDossierId()
      const panCursor5 = testDossierId()
      const panCursor6 = testDossierId()
      const created = await fixtures.dossier(
        { publicId: panCursor1, visibilite: 'PUBLIC' },
        { publicId: panCursor2, visibilite: 'PUBLIC' },
        { publicId: panCursor3, visibilite: 'PUBLIC' },
        { publicId: panCursor4, visibilite: 'PUBLIC' },
        { publicId: panCursor5, visibilite: 'PUBLIC' },
        { publicId: panCursor6, visibilite: 'PUBLIC' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDossiers({ cursor: encodeCursor(created[4]!.id) }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((p) => p.id)).toEqual([panCursor6])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'un principal ADMIN voit les dossiers PRIVÉ sans permission explicite',
    integrationTest(async () => {
      const pubId = testDossierId()
      await fixtures.dossier({ publicId: pubId, visibilite: 'PRIVE' })

      const result = await runAsAdmin('00000000-0000-0000-0000-0000000000a1', () =>
        listDossiers({}),
      )

      expect(result._unsafeUnwrap().items.map((p) => p.id)).toContain(pubId)
    }),
  )

  it(
    'un principal non-ADMIN ne voit pas un dossier PRIVÉ sans permission',
    integrationTest(async () => {
      const pubId = testDossierId()
      await fixtures.dossier({ publicId: pubId, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listDossiers({}))

      expect(result._unsafeUnwrap().items.map((p) => p.id)).not.toContain(pubId)
    }),
  )

  it(
    'filtre les dossiers par recherche sur le nom',
    integrationTest(async () => {
      const match = testDossierId()
      const other = testDossierId()
      await fixtures.dossier({ publicId: match, nom: 'Logement social', visibilite: 'PRIVE' })
      await fixtures.dossier({ publicId: other, nom: 'Transport', visibilite: 'PRIVE' })

      const result = await runAsAdmin('00000000-0000-0000-0000-0000000000a1', () =>
        listDossiers({ recherche: 'logement' }),
      )
      const ids = result._unsafeUnwrap().items.map((p) => p.id)

      expect(ids).toContain(match)
      expect(ids).not.toContain(other)
    }),
  )

  it(
    "filtre les dossiers par recherche sur l'identifiant public",
    integrationTest(async () => {
      const match = testDossierId()
      const other = testDossierId()
      await fixtures.dossier({ publicId: match, nom: 'Alpha', visibilite: 'PRIVE' })
      await fixtures.dossier({ publicId: other, nom: 'Beta', visibilite: 'PRIVE' })

      const result = await runAsAdmin('00000000-0000-0000-0000-0000000000a1', () =>
        listDossiers({ rechercheIdentifiant: match }),
      )
      const ids = result._unsafeUnwrap().items.map((p) => p.id)

      expect(ids).toContain(match)
      expect(ids).not.toContain(other)
    }),
  )
})

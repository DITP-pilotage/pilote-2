import { describe, expect, it } from 'vitest'

import { listRelations } from '@/relation/queries/listRelations'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testReferentielId, testRegId } from '@/test/randomIds'

describe.concurrent('listRelations', () => {
  it(
    "retourne une liste vide quand aucune relation n'existe",
    integrationTest(async () => {
      const result = await listRelations({})

      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    "expose l'enfant et le parent avec leur référentiel",
    integrationTest(async () => {
      const refDept = testReferentielId()
      const refReg = testReferentielId()
      const [dept] = testDeptIds(1)
      const reg = testRegId()
      await fixtures.relation({
        parent: { publicId: reg, nom: 'Occitanie', referentiel: { publicId: refReg } },
        child: { publicId: dept, nom: 'Gers', referentiel: { publicId: refDept } },
      })

      const result = await listRelations({})

      expect(result._unsafeUnwrap().items).toEqual([
        {
          enfant: { id: dept, nom: 'Gers', referentiel: refDept },
          parent: { id: reg, nom: 'Occitanie', referentiel: refReg },
        },
      ])
    }),
  )

  it(
    "trie par nom d'enfant croissant",
    integrationTest(async () => {
      const refDept = testReferentielId()
      const [a, b, c] = testDeptIds(3)
      const reg = testRegId()
      const parent = { publicId: reg, nom: 'Parent' }
      await fixtures.relation(
        {
          parent,
          child: { publicId: b, nom: 'Bouches-du-Rhône', referentiel: { publicId: refDept } },
        },
        { parent, child: { publicId: c, nom: 'Cantal', referentiel: { publicId: refDept } } },
        { parent, child: { publicId: a, nom: 'Ain', referentiel: { publicId: refDept } } },
      )

      const result = await listRelations({})

      expect(result._unsafeUnwrap().items.map((item) => item.enfant.nom)).toEqual([
        'Ain',
        'Bouches-du-Rhône',
        'Cantal',
      ])
    }),
  )

  it(
    "filtre sur le nom de l'enfant, sans tenir compte de la casse",
    integrationTest(async () => {
      const refDept = testReferentielId()
      const [garsonne, autre] = testDeptIds(2)
      const reg = testRegId()
      const parent = { publicId: reg, nom: 'Parent' }
      await fixtures.relation(
        {
          parent,
          child: { publicId: garsonne, nom: 'Zzgarsonne', referentiel: { publicId: refDept } },
        },
        { parent, child: { publicId: autre, nom: 'Zzautre', referentiel: { publicId: refDept } } },
      )

      const result = await listRelations({ recherche: 'ZZGARS' })

      expect(result._unsafeUnwrap().items.map((item) => item.enfant.id)).toEqual([garsonne])
    }),
  )

  it(
    'pagine de façon stable même quand plusieurs enfants portent le même nom',
    integrationTest(async () => {
      const refDept = testReferentielId()
      const [e1, e2, e3] = testDeptIds(3)
      const reg = testRegId()
      const parent = { publicId: reg, nom: 'Parent' }
      await fixtures.relation(
        { parent, child: { publicId: e1, nom: 'Homonyme', referentiel: { publicId: refDept } } },
        { parent, child: { publicId: e2, nom: 'Homonyme', referentiel: { publicId: refDept } } },
        { parent, child: { publicId: e3, nom: 'Homonyme', referentiel: { publicId: refDept } } },
      )

      const premiere = await listRelations({ pageSize: 2 })
      const page1 = premiere._unsafeUnwrap()
      expect(page1.items).toHaveLength(2)
      expect(page1.pagination.hasMore).toBe(true)

      const seconde = await listRelations({ pageSize: 2, cursor: page1.pagination.cursor! })
      const page2 = seconde._unsafeUnwrap()

      const vus = [...page1.items, ...page2.items].map((item) => item.enfant.id)
      expect(new Set(vus).size).toBe(3)
    }),
  )
})

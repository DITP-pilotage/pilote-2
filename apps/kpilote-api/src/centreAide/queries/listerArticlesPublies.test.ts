import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { listerArticlesCentreAidePublies } from '@/centreAide/queries/listerArticlesPublies'
import { db } from '@/framework/persistence/dbStore'
import { type ArticleCentreAideType } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const seed = (
  auteur: string,
  over: {
    type?: ArticleCentreAideType
    parentId?: string | null
    ordre?: number
    estPublie?: boolean
    estMasque?: boolean
  } = {},
) =>
  db().articleCentreAide.create({
    data: {
      id: uuidv7(),
      type: over.type ?? 'PAGE',
      parentId: over.parentId ?? null,
      ordre: over.ordre ?? 0,
      estPublie: over.estPublie ?? false,
      estMasque: over.estMasque ?? false,
      createdBy: auteur,
      updatedBy: auteur,
    },
  })

describe.concurrent('listerArticlesCentreAidePublies', () => {
  it(
    'inclut une page publiée et ses groupes ancêtres visibles',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const groupe = await seed(admin.id, { type: 'GROUPE' })
      const page = await seed(admin.id, { parentId: groupe.id, estPublie: true })

      const result = await listerArticlesCentreAidePublies()

      const ids = result._unsafeUnwrap().map((article) => article.id)
      expect(ids).toContain(groupe.id)
      expect(ids).toContain(page.id)
    }),
  )

  it(
    'exclut une page publiée dont un ancêtre est masqué (page orpheline)',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const racine = await seed(admin.id, { type: 'GROUPE' })
      const masque = await seed(admin.id, { type: 'GROUPE', parentId: racine.id, estMasque: true })
      const page = await seed(admin.id, { parentId: masque.id, estPublie: true })

      const result = await listerArticlesCentreAidePublies()

      const ids = result._unsafeUnwrap().map((article) => article.id)
      expect(ids).not.toContain(page.id)
      expect(ids).not.toContain(masque.id)
      // La racine n'a plus aucune page affichée sous elle → invisible aussi.
      expect(ids).not.toContain(racine.id)
    }),
  )
})

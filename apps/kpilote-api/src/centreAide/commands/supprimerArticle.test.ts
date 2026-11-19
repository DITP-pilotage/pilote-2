import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { supprimerArticleCentreAide } from '@/centreAide/commands/supprimerArticle'
import { db } from '@/framework/persistence/dbStore'
import { type ArticleCentreAideStatut } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin } from '@/test/runAsPrincipal'

const seed = (auteur: string, statut: ArticleCentreAideStatut) =>
  db().articleCentreAide.create({
    data: { id: uuidv7(), type: 'PAGE', ordre: 0, statut, createdBy: auteur, updatedBy: auteur },
  })

describe.concurrent('supprimerArticleCentreAide', () => {
  it(
    'supprime définitivement un article en corbeille',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const article = await seed(admin.id, 'CORBEILLE')

      const result = await runAsAdmin(admin.id, () => supprimerArticleCentreAide(article.id))

      expect(result.isOk()).toBe(true)
      expect(await db().articleCentreAide.findUnique({ where: { id: article.id } })).toBeNull()
    }),
  )

  it(
    'refuse un article qui n’est pas en corbeille',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const article = await seed(admin.id, 'ACTIF')

      const result = await runAsAdmin(admin.id, () => supprimerArticleCentreAide(article.id))

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'ARTICLE_HORS_CORBEILLE' })
    }),
  )
})

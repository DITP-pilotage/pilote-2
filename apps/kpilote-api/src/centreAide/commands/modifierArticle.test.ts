import { type ModifierArticleBody } from '@pilote/kpilote-shared/centreAide'
import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { modifierArticleCentreAide } from '@/centreAide/commands/modifierArticle'
import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type ArticleCentreAideType } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const base: ModifierArticleBody = {
  titreBrouillon: '',
  titreAfficheBrouillon: '',
  contenuBrouillon: '',
  titre: '',
  titreAffiche: '',
  contenu: '',
  parentId: null,
  ordre: 0,
  estMasque: false,
  estPublie: false,
  statut: 'ACTIF',
}

const seed = (
  auteur: string,
  over: { type?: ArticleCentreAideType; parentId?: string | null; ordre?: number } = {},
) =>
  db().articleCentreAide.create({
    data: {
      id: uuidv7(),
      type: over.type ?? 'PAGE',
      parentId: over.parentId ?? null,
      ordre: over.ordre ?? 0,
      createdBy: auteur,
      updatedBy: auteur,
    },
  })

describe.concurrent('modifierArticleCentreAide', () => {
  it(
    'recopie le contenu publié et dérive contenuTexte pour la recherche',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const page = await seed(admin.id)

      const result = await runAsAdmin(admin.id, () =>
        modifierArticleCentreAide(page.id, {
          ...base,
          contenuBrouillon: '<p>Bonjour <strong>monde</strong></p>',
          titre: 'Guide',
          titreAffiche: 'Guide',
          contenu: '<p>Bonjour <strong>monde</strong></p>',
          estPublie: true,
        }),
      )

      expect(result.isOk()).toBe(true)
      const row = await db().articleCentreAide.findUniqueOrThrow({ where: { id: page.id } })
      expect(row.estPublie).toBe(true)
      expect(row.titre).toBe('Guide')
      expect(row.contenuTexte).toBe('Bonjour monde')
    }),
  )

  it(
    'réindexe les frères pour placer l’article à la position demandée',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const a = await seed(admin.id, { ordre: 0 })
      const b = await seed(admin.id, { ordre: 1 })
      const c = await seed(admin.id, { ordre: 2 })

      await runAsAdmin(admin.id, () =>
        modifierArticleCentreAide(c.id, { ...base, parentId: null, ordre: 0 }),
      )

      const ordres = Object.fromEntries(
        (await db().articleCentreAide.findMany({ where: { parentId: null } })).map((article) => [
          article.id,
          article.ordre,
        ]),
      )
      expect(ordres[c.id]).toBe(0)
      expect(ordres[a.id]).toBe(1)
      expect(ordres[b.id]).toBe(2)
    }),
  )

  it(
    'refuse un parent qui n’est pas un groupe',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const page = await seed(admin.id, { type: 'PAGE' })
      const cible = await seed(admin.id, { type: 'PAGE' })

      await expect(
        runAsAdmin(admin.id, () =>
          modifierArticleCentreAide(page.id, { ...base, parentId: cible.id }),
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    }),
  )

  it(
    'refuse un déplacement circulaire (sous un descendant)',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const parent = await seed(admin.id, { type: 'GROUPE' })
      const enfant = await seed(admin.id, { type: 'GROUPE', parentId: parent.id })

      await expect(
        runAsAdmin(admin.id, () =>
          modifierArticleCentreAide(parent.id, { ...base, parentId: enfant.id }),
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const key = await fixtures.apiKey({ role: 'CONTRIBUTOR' })
      const page = await seed(key.id)

      await expect(
        runAsContributor(key.id, () => modifierArticleCentreAide(page.id, { ...base })),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})

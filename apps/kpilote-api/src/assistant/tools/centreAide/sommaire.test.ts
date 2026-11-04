import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { listHelpPages } from '@/assistant/tools/centreAide/sommaire'
import { db } from '@/framework/persistence/dbStore'
import { type ArticleCentreAideType } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const seed = (
  auteur: string,
  over: {
    type?: ArticleCentreAideType
    parentId?: string | null
    estPublie?: boolean
    estMasque?: boolean
    titre?: string
    contenu?: string
  } = {},
) =>
  db().articleCentreAide.create({
    data: {
      id: uuidv7(),
      type: over.type ?? 'PAGE',
      parentId: over.parentId ?? null,
      ordre: 0,
      estPublie: over.estPublie ?? true,
      estMasque: over.estMasque ?? false,
      titre: over.titre ?? 'Page',
      contenu: over.contenu ?? '<p>Contenu</p>',
      createdBy: auteur,
      updatedBy: auteur,
    },
  })

describe('listHelpPages', () => {
  it(
    'donne le chemin des rubriques, les intertitres et le texte d’une page visible',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const rubrique = await seed(admin.id, { type: 'GROUPE', titre: 'Données' })
      const page = await seed(admin.id, {
        parentId: rubrique.id,
        titre: 'Importer des valeurs',
        contenu: '<h4>Préparer le fichier</h4><p>Un CSV.</p><h5>Colonnes</h5><p>date, valeur</p>',
      })

      const pages = await listHelpPages()

      expect(pages.find((candidate) => candidate.id === page.id)).toEqual({
        id: page.id,
        titre: 'Importer des valeurs',
        chemin: ['Données'],
        intertitres: ['Préparer le fichier', 'Colonnes'],
        contenu: expect.stringContaining('Un CSV.'),
        url: `/centre-aide?article=${page.id}`,
      })
    }),
  )

  it(
    'exclut une page non publiée et une page sous une rubrique masquée',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const brouillon = await seed(admin.id, { estPublie: false })
      const masquee = await seed(admin.id, { type: 'GROUPE', estMasque: true })
      const orpheline = await seed(admin.id, { parentId: masquee.id })

      const ids = (await listHelpPages()).map((candidate) => candidate.id)

      expect(ids).not.toContain(brouillon.id)
      expect(ids).not.toContain(orpheline.id)
    }),
  )

  it(
    'lit le titre d’un accordéon comme un intertitre',
    integrationTest(async () => {
      const admin = await fixtures.apiKey({ role: 'ADMIN' })
      const page = await seed(admin.id, {
        contenu:
          '<div data-type="accordion-item" data-title="Comment est calculé le taux ?"><p>Ainsi.</p></div>',
      })

      const found = (await listHelpPages()).find((candidate) => candidate.id === page.id)

      expect(found?.intertitres).toEqual(['Comment est calculé le taux ?'])
      expect(found?.contenu).toContain('Comment est calculé le taux ?')
    }),
  )
})

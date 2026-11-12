import { describe, expect, it } from 'vitest'

import { listModalitesForAxe } from '@/axe/queries/listModalitesForAxe'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId } from '@/test/randomIds'

describe.concurrent('listModalitesForAxe', () => {
  it(
    'liste les modalités de l’axe par niveau puis par nom, avec leur parent',
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      // Créées dans le désordre pour vérifier le tri.
      const sociale = await fixtures.modalite({ nom: 'Fraude sociale', niveau: { axe, ordre: 1 } })
      const tva = await fixtures.modalite({
        nom: 'Fraude à la TVA',
        niveau: { axe, ordre: 2 },
        parent: { nom: 'Fraude fiscale', niveau: { axe, ordre: 1 } },
      })
      const ailleurs = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })

      const result = await listModalitesForAxe({ axePublicId: axe.publicId })

      const items = result._unsafeUnwrap().items
      const fiscale = items.find((item) => item.nom === 'Fraude fiscale')
      expect(items.map(({ id, nom, niveau, parent }) => ({ id, nom, niveau, parent }))).toEqual([
        { id: fiscale?.id, nom: 'Fraude fiscale', niveau: 1, parent: null },
        { id: sociale.publicId, nom: 'Fraude sociale', niveau: 1, parent: null },
        { id: tva.publicId, nom: 'Fraude à la TVA', niveau: 2, parent: fiscale?.id },
      ])
      expect(items.map((item) => item.id)).not.toContain(ailleurs.publicId)
    }),
  )

  it(
    'échoue quand l’axe n’existe pas',
    integrationTest(async () => {
      await expect(listModalitesForAxe({ axePublicId: testAxeId() })).rejects.toThrow()
    }),
  )
})

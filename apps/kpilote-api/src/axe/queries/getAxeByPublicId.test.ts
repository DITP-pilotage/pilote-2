import { describe, expect, it } from 'vitest'

import { getAxeByPublicId } from '@/axe/queries/getAxeByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId } from '@/test/randomIds'

describe.concurrent('getAxeByPublicId', () => {
  it(
    'renvoie l’axe avec ses niveaux triés par ordre et son nombre de modalités',
    integrationTest(async () => {
      const axe = { publicId: testAxeId(), nom: 'Type de fraude', description: 'Familles et types' }
      // Créés dans le désordre pour vérifier le tri.
      await fixtures.niveauAxe({ axe, ordre: 2, nom: 'Type' }, { axe, ordre: 1, nom: 'Famille' })
      await fixtures.modalite({ niveau: { axe, ordre: 1 } }, { niveau: { axe, ordre: 1 } })

      const result = await getAxeByPublicId({ publicId: axe.publicId })

      expect(result._unsafeUnwrap()).toEqual({
        id: axe.publicId,
        nom: 'Type de fraude',
        description: 'Familles et types',
        niveaux: [
          { ordre: 1, nom: 'Famille' },
          { ordre: 2, nom: 'Type' },
        ],
        nombreModalites: 2,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    }),
  )

  it(
    'échoue quand l’axe n’existe pas',
    integrationTest(async () => {
      await expect(getAxeByPublicId({ publicId: testAxeId() })).rejects.toThrow()
    }),
  )
})

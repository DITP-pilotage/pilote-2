import { describe, expect, it } from 'vitest'

import { listAxes } from '@/axe/queries/listAxes'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId } from '@/test/randomIds'

describe.concurrent('listAxes', () => {
  it(
    'liste les axes avec leurs niveaux et leur nombre de modalités',
    integrationTest(async () => {
      const axe = { publicId: testAxeId(), nom: 'Type de fraude' }
      await fixtures.niveauAxe({ axe, ordre: 1, nom: 'Famille' }, { axe, ordre: 2, nom: 'Type' })
      await fixtures.modalite({ niveau: { axe, ordre: 1 } })

      const result = await listAxes({ pageSize: 100 })

      expect(result._unsafeUnwrap().items.find((item) => item.id === axe.publicId)).toMatchObject({
        nom: 'Type de fraude',
        niveaux: [
          { ordre: 1, nom: 'Famille' },
          { ordre: 2, nom: 'Type' },
        ],
        nombreModalites: 1,
      })
    }),
  )

  it(
    'filtre sur le nom, sans tenir compte de la casse',
    integrationTest(async () => {
      const operateur = await fixtures.axe({ nom: 'Opérateur de téléphonie' })
      const fraude = await fixtures.axe({ nom: 'Type de fraude' })

      const result = await listAxes({ recherche: 'TÉLÉPHONIE', pageSize: 100 })

      const ids = result._unsafeUnwrap().items.map((item) => item.id)
      expect(ids).toContain(operateur.publicId)
      expect(ids).not.toContain(fraude.publicId)
    }),
  )
})

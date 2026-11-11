import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { MAX_PERIMETRE_INDIVIDUS, resolvePerimetre } from '@/assistant/tools/perimetre'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const token = () => randomUUID().slice(0, 8)

describe('resolvePerimetre', () => {
  it(
    'résout les enfants d’un individu par ses relations',
    integrationTest(async () => {
      const marqueur = token()
      const region = await fixtures.individu({ nom: `Région ${marqueur}` })
      const enfant = await fixtures.individu({ nom: `Département ${marqueur}` })
      await fixtures.relation({
        parent: { id: region.id, publicId: region.publicId },
        child: { id: enfant.id, publicId: enfant.publicId },
      })

      const resolved = await resolvePerimetre({ type: 'ENFANTS_DE', individuId: region.publicId })

      expect(resolved).toEqual({
        individus: [{ id: enfant.publicId, nom: `Département ${marqueur}` }],
        notFound: [],
        total: 1,
        truncated: false,
      })
    }),
  )

  it(
    `borne un périmètre à ${MAX_PERIMETRE_INDIVIDUS} individus et le signale`,
    integrationTest(async () => {
      const referentiel = await fixtures.referentiel({ nom: `Référentiel ${token()}` })
      for (let index = 0; index < 25; index += 1) {
        await fixtures.individu({ nom: `Individu ${index}`, referentiel })
      }

      const resolved = await resolvePerimetre({
        type: 'TOUT_LE_REFERENTIEL',
        referentielId: referentiel.publicId,
      })

      expect(resolved.individus).toHaveLength(MAX_PERIMETRE_INDIVIDUS)
      expect(resolved).toEqual(expect.objectContaining({ total: 25, truncated: true }))
    }),
  )

  it(
    'signale les individus désignés qui n’existent pas',
    integrationTest(async () => {
      const connu = await fixtures.individu({ nom: `Connu ${token()}` })

      const resolved = await resolvePerimetre({
        type: 'SELECTION',
        individuIds: [connu.publicId, 'INCONNU-404'],
      })

      expect(resolved.individus.map((individu) => individu.id)).toEqual([connu.publicId])
      expect(resolved.notFound).toEqual(['INCONNU-404'])
    }),
  )
})

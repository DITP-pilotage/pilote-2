import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { resolvePageContext } from '@/assistant/context/resolvePageContext'
import { Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsUser } from '@/test/runAsPrincipal'

describe('resolvePageContext', () => {
  it(
    'résout les libellés des entités de la page',
    integrationTest(async () => {
      const marqueur = randomUUID().slice(0, 8)
      const indicateur = await fixtures.indicateur({
        nom: `Indicateur ${marqueur}`,
        visibilite: Visibilite.PUBLIC,
      })
      const referentiel = await fixtures.referentiel({ nom: `Académies ${marqueur}` })
      const individu = await fixtures.individu({ nom: `Lille ${marqueur}`, referentiel })

      const resolved = await runAsUser(randomUUID(), () =>
        resolvePageContext({ indicateurId: indicateur.publicId, individuId: individu.publicId }),
      )

      expect(resolved).toEqual({
        indicateur: { id: indicateur.publicId, nom: `Indicateur ${marqueur}` },
        individu: {
          id: individu.publicId,
          nom: `Lille ${marqueur}`,
          referentiel: `Académies ${marqueur}`,
        },
      })
    }),
  )

  it(
    'ignore une entité que le principal ne peut pas lire',
    integrationTest(async () => {
      const indicateur = await fixtures.indicateur({ visibilite: Visibilite.PRIVE })

      const resolved = await runAsUser(randomUUID(), () =>
        resolvePageContext({ indicateurId: indicateur.publicId }),
      )

      expect(resolved).toBeNull()
    }),
  )
})

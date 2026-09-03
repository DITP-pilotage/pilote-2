import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { resolveSources } from '@/assistant/runtime/resolveSources'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId, testReferentielId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('resolveSources', () => {
  it(
    'résout libellé et chemin front pour un indicateur lisible',
    integrationTest(async () => {
      const publicId = testIndicateurId()
      await fixtures.indicateur({ publicId, nom: 'Fraude fiscale', visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const sources = await runAsAdmin(apiKey.id, () =>
        resolveSources([{ type: 'indicateur', publicId }]),
      )

      expect(sources).toEqual([
        {
          type: 'indicateur',
          publicId,
          label: 'Fraude fiscale',
          path: `/indicateurs/${publicId}`,
        },
      ])
    }),
  )

  it(
    'écarte une source que le principal ne peut pas lire',
    integrationTest(async () => {
      const publicId = testIndicateurId()
      await fixtures.indicateur({ publicId, nom: 'Confidentiel', visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const sources = await runAsContributor(apiKey.id, () =>
        resolveSources([{ type: 'indicateur', publicId }]),
      )

      expect(sources).toEqual([])
    }),
  )

  it(
    "résout un individu sans lien plutôt que de l'omettre",
    integrationTest(async () => {
      const refId = testReferentielId()
      const publicId = testIndividuId()
      await fixtures.individu({ publicId, nom: 'Vaucluse', referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey()

      const sources = await runAsAdmin(apiKey.id, () =>
        resolveSources([{ type: 'individu', publicId }]),
      )

      expect(sources).toEqual([{ type: 'individu', publicId, label: 'Vaucluse', path: null }])
    }),
  )

  it(
    'résout un individu que son rang alphabétique sort de la première page',
    integrationTest(async () => {
      const refId = testReferentielId()
      const publicId = testIndividuId()
      // Le nom place la cible derrière une centaine d'homologues : c'est exactement le
      // cas qui la faisait disparaître du panneau quand la résolution chargeait une page
      // puis filtrait en mémoire. Sur les données réelles, Vaucluse est au rang 114.
      const cible = await fixtures.individu({
        publicId,
        nom: 'Zone Zêta',
        referentiel: { publicId: refId },
      })
      await db().individu.createMany({
        data: Array.from({ length: 120 }, (_, index) => ({
          id: uuidv7(),
          publicId: `${publicId}-A${index}`,
          nom: `Aaa ${String(index).padStart(3, '0')}`,
          referentielId: cible.referentielId,
        })),
      })
      const apiKey = await fixtures.apiKey()

      const sources = await runAsAdmin(apiKey.id, () =>
        resolveSources([{ type: 'individu', publicId }]),
      )

      expect(sources).toEqual([{ type: 'individu', publicId, label: 'Zone Zêta', path: null }])
    }),
  )

  it(
    'renvoie un tableau vide sans référence',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      expect(await runAsAdmin(apiKey.id, () => resolveSources([]))).toEqual([])
    }),
  )
})

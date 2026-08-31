import { describe, expect, it } from 'vitest'

import { resoudreSources } from '@/assistant/runtime/sources'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId, testReferentielId } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

describe.concurrent('resoudreSources', () => {
  it(
    'résout libellé et chemin front pour un indicateur lisible',
    integrationTest(async () => {
      const publicId = testIndicateurId()
      await fixtures.indicateur({ publicId, nom: 'Fraude fiscale', visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const sources = await runAsAdmin(apiKey.id, () =>
        resoudreSources([{ type: 'indicateur', publicId }]),
      )

      expect(sources).toEqual([
        {
          type: 'indicateur',
          publicId,
          libelle: 'Fraude fiscale',
          chemin: `/indicateurs/${publicId}`,
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
        resoudreSources([{ type: 'indicateur', publicId }]),
      )

      expect(sources).toEqual([])
    }),
  )

  it(
    'résout un individu sans lien plutôt que de l’omettre',
    integrationTest(async () => {
      const refId = testReferentielId()
      const publicId = testIndividuId()
      await fixtures.individu({ publicId, nom: 'Vaucluse', referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey()

      const sources = await runAsAdmin(apiKey.id, () =>
        resoudreSources([{ type: 'individu', publicId }]),
      )

      expect(sources).toEqual([{ type: 'individu', publicId, libelle: 'Vaucluse', chemin: null }])
    }),
  )

  it(
    'renvoie un tableau vide sans référence',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      expect(await runAsAdmin(apiKey.id, () => resoudreSources([]))).toEqual([])
    }),
  )
})

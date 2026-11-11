import { randomUUID } from 'node:crypto'

import { afterEach, describe, expect, it } from 'vitest'

import { searchCollections } from '@/assistant/tools/searchCollections'
import { searchIndicateurs } from '@/assistant/tools/searchIndicateurs'
import { searchIndividus } from '@/assistant/tools/searchIndividus'
import { registerModelWrapper } from '@/framework/llm/albert'
import { Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { textModel } from '@/test/mockModel'
import { runToolAs } from '@/test/toolHarness'

const token = () => randomUUID().slice(0, 8)

describe('outils de recherche', { concurrent: false }, () => {
  afterEach(() => registerModelWrapper(null))

  it(
    'search_indicateurs trouve un indicateur lisible et ignore un indicateur privé',
    integrationTest(async () => {
      const marqueur = token()
      const visible = await fixtures.indicateur({
        nom: `Fraude ${marqueur}`,
        visibilite: Visibilite.PUBLIC,
      })
      await fixtures.indicateur({ nom: `Fraude privee ${marqueur}`, visibilite: Visibilite.PRIVE })

      const output = await runToolAs(randomUUID(), 'search_indicateurs', searchIndicateurs, {
        query: `fraude ${marqueur}`,
      })

      expect(output).toEqual({ results: [{ id: visible.publicId, nom: `Fraude ${marqueur}` }] })
    }),
  )

  it(
    'search_collections classe plusieurs candidats par le modèle du tour',
    integrationTest(async () => {
      const marqueur = token()
      const premiere = await fixtures.collection({
        nom: `Sante ${marqueur} A`,
        visibilite: Visibilite.PUBLIC,
      })
      const seconde = await fixtures.collection({
        nom: `Sante ${marqueur} B`,
        visibilite: Visibilite.PUBLIC,
      })
      registerModelWrapper(() =>
        textModel(JSON.stringify({ ids: [seconde.publicId, premiere.publicId] })),
      )

      const output = await runToolAs(randomUUID(), 'search_collections', searchCollections, {
        query: `sante ${marqueur}`,
      })

      expect(output).toEqual({
        results: [
          { id: seconde.publicId, nom: `Sante ${marqueur} B` },
          { id: premiere.publicId, nom: `Sante ${marqueur} A` },
        ],
      })
    }),
  )

  it(
    'search_individus filtre par référentiel',
    integrationTest(async () => {
      const marqueur = token()
      const academies = await fixtures.referentiel({ nom: `Académies ${marqueur}` })
      const bassins = await fixtures.referentiel({ nom: `Bassins ${marqueur}` })
      await fixtures.individu({ nom: `Nord ${marqueur}`, referentiel: academies })
      const bassin = await fixtures.individu({ nom: `Nord ${marqueur}`, referentiel: bassins })

      const output = await runToolAs(randomUUID(), 'search_individus', searchIndividus, {
        query: `nord ${marqueur}`,
        referentielId: bassins.publicId,
      })

      expect(output).toEqual({
        results: [
          {
            id: bassin.publicId,
            nom: `Nord ${marqueur}`,
            referentiel: { id: bassins.publicId, nom: `Bassins ${marqueur}` },
          },
        ],
      })
    }),
  )
})

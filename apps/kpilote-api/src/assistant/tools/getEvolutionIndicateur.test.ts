import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { getEvolutionIndicateur, MAX_POINTS } from '@/assistant/tools/getEvolutionIndicateur'
import { Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runToolAs } from '@/test/toolHarness'

const monthsFrom2020 = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const year = 2020 + Math.floor(index / 12)
    const month = String((index % 12) + 1).padStart(2, '0')
    return `${year}-${month}-01`
  })

describe('get_evolution_indicateur', () => {
  it(
    `garde les ${MAX_POINTS} points les plus récents en ordre chronologique`,
    integrationTest(async () => {
      const marqueur = randomUUID().slice(0, 8)
      const referentiel = await fixtures.referentiel({ nom: `Référentiel ${marqueur}` })
      const indicateur = await fixtures.indicateur({
        nom: `Indicateur ${marqueur}`,
        visibilite: Visibilite.PUBLIC,
      })
      await fixtures.indicateurReferentiel({ indicateur, referentiel })
      const { id, publicId } = await fixtures.individu({ nom: `Individu ${marqueur}`, referentiel })
      const dates = monthsFrom2020(70)
      for (const [index, date] of dates.entries()) {
        await fixtures.valeurAvancement({
          indicateur,
          individu: { id, publicId },
          date,
          valeur: index,
        })
      }

      const output = await runToolAs(
        randomUUID(),
        'get_evolution_indicateur',
        getEvolutionIndicateur,
        {
          indicateurId: indicateur.publicId,
          individuId: publicId,
        },
      )

      expect(output).toEqual(
        expect.objectContaining({
          indicateur: expect.objectContaining({ id: indicateur.publicId }),
          individu: { id: publicId, nom: `Individu ${marqueur}` },
          total: 70,
          truncated: true,
          notFound: [],
        }),
      )
      const points = (output as { points: Array<{ date: string; valeur: number }> }).points
      expect(points).toHaveLength(MAX_POINTS)
      expect(points[0]).toEqual({ date: dates[10], valeur: 10 })
      expect(points.at(-1)).toEqual({ date: dates[69], valeur: 69 })
    }),
  )
})

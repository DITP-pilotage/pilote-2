import { randomUUID } from 'node:crypto'

import { uuidv7 } from 'uuidv7'
import { afterEach, describe, expect, it } from 'vitest'

import { consultCentreAide } from '@/assistant/tools/centreAide/consultCentreAide'
import { registerModelWrapper } from '@/framework/llm/albert'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { sequenceTextModel } from '@/test/mockModel'
import { runToolAs } from '@/test/toolHarness'

const givenPage = async () => {
  const admin = await fixtures.apiKey({ role: 'ADMIN' })
  return db().articleCentreAide.create({
    data: {
      id: uuidv7(),
      type: 'PAGE',
      ordre: 0,
      estPublie: true,
      titre: 'Taux de progression',
      contenu: '<p>Le taux de progression mesure le chemin vers l’objectif.</p>',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  })
}

const ask = () =>
  runToolAs(randomUUID(), 'consult_centre_aide', consultCentreAide, {
    question: 'Comment est calculé le taux de progression ?',
  })

describe('consult_centre_aide', { concurrent: false }, () => {
  afterEach(() => registerModelWrapper(null))

  it(
    'répond sans second appel quand aucune page ne traite la question',
    integrationTest(async () => {
      await givenPage()
      const { model, state } = sequenceTextModel([JSON.stringify({ ids: [], reasoning: 'rien' })])
      registerModelWrapper(() => model)

      expect(await ask()).toEqual({ found: false, answer: '', sources: [] })
      expect(state.calls).toBe(1)
    }),
  )

  it(
    'cite les pages réellement utilisées, avec leur lien, et écarte un identifiant inventé',
    integrationTest(async () => {
      const page = await givenPage()
      const { model } = sequenceTextModel([
        JSON.stringify({ ids: ['page-inventee', page.id], reasoning: 'pertinent' }),
        JSON.stringify({ found: true, answer: 'Il mesure le chemin.', sourcesIds: [page.id] }),
      ])
      registerModelWrapper(() => model)

      expect(await ask()).toEqual({
        found: true,
        answer: 'Il mesure le chemin.',
        sources: [
          {
            id: page.id,
            titre: 'Taux de progression',
            chemin: [],
            url: `/centre-aide?article=${page.id}`,
          },
        ],
      })
    }),
  )

  it(
    'ne prétend pas avoir trouvé quand aucune source citée n’a été lue',
    integrationTest(async () => {
      const page = await givenPage()
      const { model } = sequenceTextModel([
        JSON.stringify({ ids: [page.id], reasoning: 'pertinent' }),
        JSON.stringify({ found: true, answer: 'Réponse.', sourcesIds: ['page-inventee'] }),
      ])
      registerModelWrapper(() => model)

      expect(await ask()).toEqual({ found: false, answer: '', sources: [] })
    }),
  )

  it(
    'ne cite qu’une fois une page que le sous-agent répète',
    integrationTest(async () => {
      const page = await givenPage()
      const { model } = sequenceTextModel([
        JSON.stringify({ ids: [page.id, page.id], reasoning: 'pertinent' }),
        JSON.stringify({ found: true, answer: 'Réponse.', sourcesIds: [page.id, page.id] }),
      ])
      registerModelWrapper(() => model)

      const output = (await ask()) as { sources: unknown[] }

      expect(output.sources).toHaveLength(1)
    }),
  )

  it('ne montre au modèle principal ni lien ni identifiant de page', () => {
    const toModel = consultCentreAide.toModelOutput?.({
      found: true,
      answer: 'Ainsi.',
      sources: [
        { id: 'a1', titre: 'Importer', chemin: ['Données'], url: '/centre-aide?article=a1' },
      ],
    })

    expect(toModel).toEqual({ found: true, answer: 'Ainsi.', pages: ['Importer'] })
  })
})

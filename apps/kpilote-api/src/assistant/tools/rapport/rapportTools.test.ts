import { randomUUID } from 'node:crypto'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getCommentaires } from '@/assistant/tools/getCommentaires'
import { writeComparaison } from '@/assistant/tools/rapport/writeComparaison'
import { writeSynthese } from '@/assistant/tools/rapport/writeSynthese'
import { env } from '@/env'
import { registerModelWrapper } from '@/framework/llm/albert'
import { UniteIndicateur, Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { streamTextModel } from '@/test/mockModel'
import { collectToolStates } from '@/test/toolHarness'

const token = () => randomUUID().slice(0, 8)

const givenIndicateur = async (visibilite: Visibilite = Visibilite.PUBLIC) => {
  const marqueur = token()
  const referentiel = await fixtures.referentiel({ nom: `Départements ${marqueur}` })
  const indicateur = await fixtures.indicateur({
    nom: `Chômage ${marqueur}`,
    visibilite,
    unite: UniteIndicateur.POURCENTAGE,
  })
  await fixtures.indicateurReferentiel({ indicateur, referentiel })
  const individus = await Promise.all(
    ['Vaucluse', 'Var'].map(async (nom) => {
      const { id, publicId } = await fixtures.individu({ nom: `${nom} ${marqueur}`, referentiel })
      return { id, publicId }
    }),
  )
  const [vaucluse, var_] = individus as [(typeof individus)[0], (typeof individus)[0]]
  await fixtures.valeurAvancement(
    { indicateur, individu: vaucluse, date: '2026-01-01', valeur: 9.5 },
    { indicateur, individu: vaucluse, date: '2026-02-01', valeur: 9.1 },
    { indicateur, individu: var_, date: '2026-02-01', valeur: 8 },
  )
  await fixtures.objectifIndicateurIndividu({
    indicateur,
    individu: vaucluse,
    dateCible: '2027-01-01',
    valeurCible: 7,
  })
  return { indicateur, vaucluse, var_, marqueur }
}

const lastPrompt = (model: ReturnType<typeof streamTextModel>): string =>
  JSON.stringify(model.doStreamCalls.at(-1)?.prompt ?? [])

describe('encarts', { concurrent: false }, () => {
  afterEach(() => {
    registerModelWrapper(null)
    vi.restoreAllMocks()
  })

  it(
    'rédige la synthèse d’un indicateur à partir de données déjà formatées',
    integrationTest(async () => {
      const { indicateur, vaucluse, marqueur } = await givenIndicateur()
      const model = streamTextModel(['# Synthèse', '\n\nTexte'])
      registerModelWrapper(() => model)

      const states = await collectToolStates(randomUUID(), 'write_synthese', writeSynthese, {
        sujet: { type: 'INDICATEUR', indicateurId: indicateur.publicId },
        individuId: vaucluse.publicId,
      })

      expect(states.at(-1)).toEqual(
        expect.objectContaining({ type: 'synthese', markdown: '# Synthèse\n\nTexte', done: true }),
      )
      const prompt = lastPrompt(model)
      expect(prompt).toContain(`Chômage ${marqueur}`)
      expect(prompt).toContain('9,1 %')
      expect(prompt).toContain('1 février 2026')
    }),
  )

  it(
    'ne rédige rien sur un indicateur que l’utilisateur ne peut pas lire',
    integrationTest(async () => {
      const { indicateur, vaucluse } = await givenIndicateur(Visibilite.PRIVE)
      const model = streamTextModel(['texte'])
      registerModelWrapper(() => model)

      const states = await collectToolStates(randomUUID(), 'write_synthese', writeSynthese, {
        sujet: { type: 'INDICATEUR', indicateurId: indicateur.publicId },
        individuId: vaucluse.publicId,
      })

      expect(states).toEqual([
        expect.objectContaining({ done: true, notFound: [indicateur.publicId] }),
      ])
      expect(model.doStreamCalls).toHaveLength(0)
    }),
  )

  it(
    'rédige la synthèse d’une collection avec chacun de ses indicateurs',
    integrationTest(async () => {
      const { indicateur, vaucluse, marqueur } = await givenIndicateur()
      const collection = await fixtures.collection({
        nom: `Emploi ${marqueur}`,
        visibilite: Visibilite.PUBLIC,
        indicateurs: [{ id: indicateur.id, publicId: indicateur.publicId }],
      })
      const model = streamTextModel(['# Synthèse'])
      registerModelWrapper(() => model)

      await collectToolStates(randomUUID(), 'write_synthese', writeSynthese, {
        sujet: { type: 'COLLECTION', collectionId: collection.publicId },
        individuId: vaucluse.publicId,
      })

      const prompt = lastPrompt(model)
      expect(prompt).toContain(`Emploi ${marqueur}`)
      expect(prompt).toContain(`Chômage ${marqueur}`)
      expect(prompt).toContain('9,1 %')
    }),
  )

  it(
    'dit combien d’indicateurs une synthèse de collection laisse de côté',
    integrationTest(async () => {
      const { vaucluse, marqueur } = await givenIndicateur()
      const indicateurs = await Promise.all(
        Array.from({ length: 21 }, (_, index) =>
          fixtures.indicateur({ nom: `Ind ${index} ${marqueur}`, visibilite: Visibilite.PUBLIC }),
        ),
      )
      const collection = await fixtures.collection({
        nom: `Grande ${marqueur}`,
        visibilite: Visibilite.PUBLIC,
        indicateurs: indicateurs.map(({ id, publicId }) => ({ id, publicId })),
      })
      const model = streamTextModel(['# Synthèse'])
      registerModelWrapper(() => model)

      await collectToolStates(randomUUID(), 'write_synthese', writeSynthese, {
        sujet: { type: 'COLLECTION', collectionId: collection.publicId },
        individuId: vaucluse.publicId,
      })

      expect(lastPrompt(model)).toContain('20 indicateurs sur 21')
    }),
  )

  it(
    'compare un indicateur entre plusieurs individus',
    integrationTest(async () => {
      const { indicateur, vaucluse, var_, marqueur } = await givenIndicateur()
      const model = streamTextModel(['# Comparaison'])
      registerModelWrapper(() => model)

      const states = await collectToolStates(randomUUID(), 'write_comparaison', writeComparaison, {
        sujet: { type: 'INDICATEUR', indicateurId: indicateur.publicId },
        perimetre: { type: 'SELECTION', individuIds: [vaucluse.publicId, var_.publicId] },
      })

      expect(states.at(-1)).toEqual(
        expect.objectContaining({ type: 'comparaison', markdown: '# Comparaison', done: true }),
      )
      const prompt = lastPrompt(model)
      expect(prompt).toContain(`Vaucluse ${marqueur}`)
      expect(prompt).toContain(`Var ${marqueur}`)
      expect(prompt).toContain('8 %')
    }),
  )

  it(
    'borne les lectures simultanées d’une comparaison sur un large périmètre',
    integrationTest(async () => {
      const { indicateur, marqueur } = await givenIndicateur()
      const referentiel = await fixtures.referentiel({ nom: `Régions ${marqueur}` })
      await fixtures.indicateurReferentiel({ indicateur, referentiel })
      const individus = await Promise.all(
        Array.from({ length: env.MAX_ASYNC_CONCURRENCY + 3 }, (_, index) =>
          fixtures.individu({ nom: `Région ${index} ${marqueur}`, referentiel }),
        ),
      )
      registerModelWrapper(() => streamTextModel(['# Comparaison']))
      const execute = getCommentaires.execute.bind(getCommentaires)
      let inFlight = 0
      let maxInFlight = 0
      vi.spyOn(getCommentaires, 'execute').mockImplementation(async (...args) => {
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)
        try {
          return await execute(...args)
        } finally {
          inFlight -= 1
        }
      })

      await collectToolStates(randomUUID(), 'write_comparaison', writeComparaison, {
        sujet: { type: 'INDICATEUR', indicateurId: indicateur.publicId },
        perimetre: {
          type: 'SELECTION',
          individuIds: individus.map((individu) => individu.publicId),
        },
      })

      expect(maxInFlight).toBeGreaterThan(1)
      expect(maxInFlight).toBeLessThanOrEqual(env.MAX_ASYNC_CONCURRENCY)
    }),
  )

  it(
    'refuse une comparaison qui ne désigne qu’un individu',
    integrationTest(async () => {
      const { indicateur, vaucluse } = await givenIndicateur()
      const model = streamTextModel(['texte'])
      registerModelWrapper(() => model)

      const states = await collectToolStates(randomUUID(), 'write_comparaison', writeComparaison, {
        sujet: { type: 'INDICATEUR', indicateurId: indicateur.publicId },
        perimetre: { type: 'SELECTION', individuIds: [vaucluse.publicId] },
      })

      expect(states).toEqual([
        expect.objectContaining({ done: true, needsClarification: expect.any(String) }),
      ])
      expect(model.doStreamCalls).toHaveLength(0)
    }),
  )

  it('ne montre au modèle principal que le texte de l’encart', () => {
    expect(
      writeSynthese.toModelOutput?.({
        type: 'synthese',
        dateRedaction: '',
        markdown: '# Titre',
        done: true,
      }),
    ).toBe('# Titre')
  })
})

import { type LanguageModel } from 'ai'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  createAlbertModel,
  generateStructured,
  registerModelWrapper,
  streamSubagentText,
} from '@/framework/llm/albert'
import { TurnTrace } from '@/framework/llm/turnTrace'
import { streamTextModel, textModel } from '@/test/mockModel'

describe('albert', { concurrent: false }, () => {
  afterEach(() => registerModelWrapper(null))

  it('applique le wrapper enregistré à tout modèle créé', () => {
    const wrapped: LanguageModel[] = []
    registerModelWrapper((model) => {
      wrapped.push(model)
      return model
    })

    createAlbertModel('openweight-medium')

    expect(wrapped).toHaveLength(1)
  })

  it('generateStructured renvoie la sortie validée et trace le sous-appel', async () => {
    registerModelWrapper(() => textModel('{"ids":["IND-1"]}'))
    const trace = new TurnTrace()

    const output = await generateStructured({
      name: 'search_indicateurs.ranking',
      model: 'openweight-large',
      system: 's',
      prompt: 'p',
      schema: z.object({ ids: z.array(z.string()) }),
      trace,
    })

    expect(output).toEqual({ ids: ['IND-1'] })
    expect(trace.entries()).toEqual([
      expect.objectContaining({
        name: 'search_indicateurs.ranking',
        model: 'openweight-large',
        inputTokens: 10,
        outputTokens: 5,
      }),
    ])
  })

  it('streamSubagentText émet le texte au fil de l’eau et trace le sous-appel', async () => {
    registerModelWrapper(() => streamTextModel(['Bon', 'jour']))
    const trace = new TurnTrace()

    const chunks: string[] = []
    for await (const chunk of streamSubagentText({
      name: 'write_synthese',
      model: 'openweight-large',
      system: 's',
      prompt: 'p',
      trace,
    })) {
      chunks.push(chunk)
    }

    expect(chunks.join('')).toBe('Bonjour')
    expect(trace.entries()).toEqual([
      expect.objectContaining({ name: 'write_synthese', inputTokens: 10, outputTokens: 5 }),
    ])
  })
})

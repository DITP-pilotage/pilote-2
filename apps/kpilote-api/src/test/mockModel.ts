import { MockLanguageModelV4 } from 'ai/test'

export const usage = (inputTokens: number, outputTokens: number) => ({
  inputTokens: { total: inputTokens, noCache: inputTokens, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: outputTokens, text: outputTokens, reasoning: 0 },
})

/** Un modèle qui répond toujours le même texte, avec un usage connu. */
export const textModel = (text: string, tokens = usage(10, 5)) =>
  new MockLanguageModelV4({
    doGenerate: () =>
      Promise.resolve({
        content: [{ type: 'text', text }],
        finishReason: { unified: 'stop', raw: 'stop' },
        usage: tokens,
        warnings: [],
      }),
  })

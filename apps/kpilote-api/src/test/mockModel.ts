import { simulateReadableStream } from 'ai'
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

type ScriptedStep = { text: string } | { toolCall: { name: string; input: unknown } }

/** Un modèle qui joue une étape scriptée par appel : un appel d'outil ou un texte final. */
export const scriptedStreamModel = (steps: ReadonlyArray<ScriptedStep>) => {
  let index = 0
  return new MockLanguageModelV4({
    doStream: () => {
      const step = steps[Math.min(index, steps.length - 1)]
      index += 1
      const body =
        step && 'toolCall' in step
          ? [
              {
                type: 'tool-call' as const,
                toolCallId: `call-${index}`,
                toolName: step.toolCall.name,
                input: JSON.stringify(step.toolCall.input),
              },
            ]
          : [
              { type: 'text-start' as const, id: `t-${index}` },
              { type: 'text-delta' as const, id: `t-${index}`, delta: step?.text ?? '' },
              { type: 'text-end' as const, id: `t-${index}` },
            ]
      const finishReason =
        step && 'toolCall' in step
          ? { unified: 'tool-calls' as const, raw: 'tool_calls' }
          : { unified: 'stop' as const, raw: 'stop' }
      return Promise.resolve({
        stream: simulateReadableStream({
          chunks: [
            { type: 'stream-start' as const, warnings: [] },
            ...body,
            { type: 'finish' as const, finishReason, usage: usage(10, 5) },
          ],
        }),
      })
    },
  })
}

/** Un modèle dont le flux échoue après avoir commencé, comme une coupure d'Albert. */
export const failingStreamModel = () =>
  new MockLanguageModelV4({
    doStream: () =>
      Promise.resolve({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'stream-start', warnings: [] })
            controller.error(new Error('Albert indisponible'))
          },
        }),
      }),
  })

/** Un modèle qui répond les textes donnés, un par appel, et compte ses appels. */
export const sequenceTextModel = (texts: ReadonlyArray<string>) => {
  const state = { calls: 0 }
  const model = new MockLanguageModelV4({
    doGenerate: () => {
      const text = texts[Math.min(state.calls, texts.length - 1)] ?? ''
      state.calls += 1
      return Promise.resolve({
        content: [{ type: 'text', text }],
        finishReason: { unified: 'stop', raw: 'stop' },
        usage: usage(10, 5),
        warnings: [],
      })
    },
  })
  return { model, state }
}

/** Un modèle qui streame les morceaux donnés, et retient le dernier prompt reçu. */
export const streamTextModel = (chunks: ReadonlyArray<string>) => {
  const model = new MockLanguageModelV4({
    doStream: () =>
      Promise.resolve({
        stream: simulateReadableStream({
          chunks: [
            { type: 'stream-start' as const, warnings: [] },
            { type: 'text-start' as const, id: 't' },
            ...chunks.map((delta) => ({ type: 'text-delta' as const, id: 't', delta })),
            { type: 'text-end' as const, id: 't' },
            {
              type: 'finish' as const,
              finishReason: { unified: 'stop' as const, raw: 'stop' },
              usage: usage(10, 5),
            },
          ],
        }),
      }),
  })
  return model
}

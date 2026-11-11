import { randomUUID } from 'node:crypto'

import { generateText } from 'ai'
import { MockLanguageModelV4 } from 'ai/test'
import { describe, expect, it } from 'vitest'

import { buildAgent } from '@/assistant/agent'
import { captureContext } from '@/framework/context/captureContext'
import { TurnTrace } from '@/framework/llm/turnTrace'
import { integrationTest } from '@/test/integrationTest'
import { usage } from '@/test/mockModel'
import { runAsUser } from '@/test/runAsPrincipal'

const clarifyThenSearch = () => {
  let step = 0
  return new MockLanguageModelV4({
    doGenerate: () => {
      step += 1
      const call =
        step === 1
          ? {
              toolName: 'clarify_with_choices',
              input: JSON.stringify({
                question: 'Quel indicateur ?',
                choices: [
                  { label: 'Fraude fiscale', value: 'a' },
                  { label: 'Fraude sociale', value: 'b' },
                ],
              }),
            }
          : { toolName: 'search_indicateurs', input: JSON.stringify({ query: 'fraude' }) }
      return Promise.resolve({
        content: [{ type: 'tool-call', toolCallId: `call-${step}`, ...call }],
        finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
        usage: usage(10, 5),
        warnings: [],
      })
    },
  })
}

describe('buildAgent', () => {
  it(
    's’arrête après une question de précision',
    integrationTest(async () => {
      const agent = await runAsUser(randomUUID(), () =>
        buildAgent({
          pageContext: undefined,
          model: 'openweight-large',
          trace: new TurnTrace(),
          runInContext: captureContext(),
        }),
      )

      const result = await generateText({ model: clarifyThenSearch(), prompt: 'fraude', ...agent })

      expect(result.steps.flatMap((step) => step.toolCalls.map((call) => call.toolName))).toEqual([
        'clarify_with_choices',
      ])
    }),
  )
})

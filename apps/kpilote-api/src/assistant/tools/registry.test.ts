import { TOOL_NAMES } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it } from 'vitest'

import {
  buildTools,
  REPEATED_FAILURE,
  toAiTool,
  toLoggableError,
  type ToolContext,
} from '@/assistant/tools/registry'
import { clarifyWithChoices } from '@/assistant/tools/clarifyWithChoices'
import { captureContext } from '@/framework/context/captureContext'
import { ValidationError } from '@/framework/errors/AppError'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { TurnTrace } from '@/framework/llm/turnTrace'
import { integrationTest } from '@/test/integrationTest'
import { runAsUser } from '@/test/runAsPrincipal'

const callOptions = { toolCallId: 't', messages: [], context: undefined }

const collect = async (result: unknown): Promise<unknown[]> => {
  const states: unknown[] = []
  if (typeof result === 'object' && result !== null && Symbol.asyncIterator in result) {
    for await (const state of result as AsyncIterable<unknown>) states.push(state)
  }
  return states
}

const contextFor = (principalId: string): ToolContext =>
  runAsUser(principalId, () => ({
    model: 'openweight-large',
    trace: new TurnTrace(),
    runInContext: captureContext(),
  }))

describe('registre des outils', () => {
  it(
    'expose exactement les outils déclarés dans le contrat',
    integrationTest(() => {
      expect(Object.keys(buildTools(contextFor('u-1')))).toEqual([...TOOL_NAMES])
      return Promise.resolve()
    }),
  )

  it(
    'exécute un outil sous le principal capturé',
    integrationTest(async () => {
      const tool = toAiTool(
        'clarify_with_choices',
        {
          description: 'test',
          execute: () => Promise.resolve({ question: requireCurrentPrincipalId(), choices: [] }),
        },
        contextFor('principal-capture'),
      )

      const output = await tool.execute?.({ question: 'q', choices: [] }, callOptions)

      expect(output).toEqual({ question: 'principal-capture', choices: [] })
    }),
  )

  it(
    'refuse de rejouer à l’identique un appel en échec',
    integrationTest(async () => {
      let calls = 0
      const tool = toAiTool(
        'clarify_with_choices',
        {
          description: 'test',
          execute: () => {
            calls += 1
            return Promise.reject(new ValidationError('boom'))
          },
        },
        contextFor('u-2'),
      )
      const input = { question: 'q', choices: [] }

      await tool.execute?.(input, callOptions)
      const second = await tool.execute?.(input, callOptions)

      expect(second).toEqual(REPEATED_FAILURE)
      expect(calls).toBe(1)
    }),
  )

  it(
    "transmet au modèle le message d'une erreur métier",
    integrationTest(async () => {
      const tool = toAiTool(
        'clarify_with_choices',
        {
          description: 'test',
          execute: () => Promise.reject(new ValidationError('période invalide')),
        },
        contextFor('u-3'),
      )

      expect(await tool.execute?.({ question: 'q', choices: [] }, callOptions)).toEqual({
        error: expect.stringContaining('période invalide'),
      })
    }),
  )

  it(
    "ne transmet pas le message d'une erreur interne",
    integrationTest(async () => {
      const tool = toAiTool(
        'clarify_with_choices',
        {
          description: 'test',
          execute: () => Promise.reject(new Error('relation "secret_table" does not exist')),
        },
        contextFor('u-5'),
      )

      const output = await tool.execute?.({ question: 'q', choices: [] }, callOptions)

      expect(JSON.stringify(output)).not.toContain('secret_table')
      expect(
        toLoggableError(
          Object.assign(new Error('boom'), { requestBodyValues: { prompt: 'données' } }),
        ),
      ).toEqual({
        name: 'Error',
        message: 'boom',
        stack: expect.any(String),
      })
      expect(output).toEqual({ error: expect.any(String) })
    }),
  )

  it(
    'tronque le message journalisé, qui peut recopier la conversation',
    integrationTest(() => {
      const logged = toLoggableError(new Error(`${'x'.repeat(1000)}SENTINELLE`))
      expect(logged.message).toHaveLength(300)
      expect(JSON.stringify(logged)).not.toContain('SENTINELLE')
      return Promise.resolve()
    }),
  )

  it(
    'clarify_with_choices renvoie la question et les choix',
    integrationTest(async () => {
      const input = {
        question: 'Quel indicateur ?',
        choices: [
          { label: 'Fraude fiscale', value: 'IND-1' },
          { label: 'Fraude sociale', value: 'IND-2' },
        ],
      }
      const tool = toAiTool('clarify_with_choices', clarifyWithChoices, contextFor('u-4'))

      expect(await tool.execute?.(input, callOptions)).toEqual(input)
    }),
  )

  it(
    'relaie chaque état d’un outil qui rédige, sous le principal capturé',
    integrationTest(async () => {
      const tool = toAiTool(
        'clarify_with_choices',
        {
          description: 'test',
          async *stream() {
            yield { step: 1, principal: requireCurrentPrincipalId() }
            await Promise.resolve()
            yield { step: 2, principal: requireCurrentPrincipalId() }
          },
        },
        contextFor('principal-redaction'),
      )

      expect(await collect(tool.execute?.({ question: 'q', choices: [] }, callOptions))).toEqual([
        { step: 1, principal: 'principal-redaction' },
        { step: 2, principal: 'principal-redaction' },
      ])
    }),
  )

  it(
    'termine en erreur lisible un outil qui échoue en pleine rédaction',
    integrationTest(async () => {
      const tool = toAiTool(
        'clarify_with_choices',
        {
          description: 'test',
          async *stream() {
            yield { step: 1 }
            await Promise.resolve()
            throw new ValidationError('rédaction interrompue')
          },
        },
        contextFor('u-6'),
      )

      const states = await collect(tool.execute?.({ question: 'q', choices: [] }, callOptions))

      expect(states.at(-1)).toEqual({ error: expect.stringContaining('rédaction interrompue') })
    }),
  )
})

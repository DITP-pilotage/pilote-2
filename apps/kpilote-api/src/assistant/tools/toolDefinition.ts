import { type Model } from '@pilote/kpilote-shared/assistant/chat'
import {
  type ToolInput,
  type ToolName,
  type ToolOutputs,
} from '@pilote/kpilote-shared/assistant/tools'
import { type JSONValue } from 'ai'

import { type RunInContext } from '@/framework/context/captureContext'
import { type TurnTrace } from '@/framework/llm/turnTrace'

export type ToolContext = { model: Model; trace: TurnTrace; runInContext: RunInContext }

export type ToolExecuteOptions = { abortSignal?: AbortSignal; context: ToolContext }

// Signatures de méthode, bivariantes : une définition typée par outil se range sans cast
// dans `AnyToolDefinition`, la forme que l'enveloppe commune manipule.
export type ToolDefinition<N extends ToolName> = {
  description: string
  execute(input: ToolInput<N>, options: ToolExecuteOptions): Promise<ToolOutputs[N]>
  /** Ce que le modèle relit de la sortie, quand l'interface en a besoin de davantage. */
  toModelOutput?(output: ToolOutputs[N]): JSONValue
}

export type AnyToolDefinition = {
  description: string
  execute(input: unknown, options: ToolExecuteOptions): Promise<unknown>
  toModelOutput?(output: unknown): JSONValue
}

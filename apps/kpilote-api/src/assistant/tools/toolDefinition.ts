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
type ToolBase<N extends ToolName> = {
  description: string
  /** Ce que le modèle relit de la sortie, quand l'interface en a besoin de davantage. */
  toModelOutput?(output: ToolOutputs[N]): JSONValue
}

/** Un outil qui répond en une fois. */
export type QueryToolDefinition<N extends ToolName> = ToolBase<N> & {
  execute(input: ToolInput<N>, options: ToolExecuteOptions): Promise<ToolOutputs[N]>
}

/**
 * Un outil qui émet ses états au fil d'une rédaction : le SDK en fait des résultats
 * intermédiaires, le dernier état est la sortie.
 */
export type StreamToolDefinition<N extends ToolName> = ToolBase<N> & {
  stream(input: ToolInput<N>, options: ToolExecuteOptions): AsyncIterable<ToolOutputs[N]>
}

export type ToolDefinition<N extends ToolName> = QueryToolDefinition<N> | StreamToolDefinition<N>

export type AnyToolDefinition = {
  description: string
  toModelOutput?(output: unknown): JSONValue
} & (
  | { execute(input: unknown, options: ToolExecuteOptions): Promise<unknown> }
  | { stream(input: unknown, options: ToolExecuteOptions): AsyncIterable<unknown> }
)

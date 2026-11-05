import { type ToolName } from '@pilote/kpilote-shared/assistant/tools'

import { toAiTool, type ToolContext } from '@/assistant/tools/registry'
import { type AnyToolDefinition } from '@/assistant/tools/toolDefinition'
import { captureContext } from '@/framework/context/captureContext'
import { TurnTrace } from '@/framework/llm/turnTrace'
import { runAsUser } from '@/test/runAsPrincipal'

/** Exécute un outil comme le ferait le SDK, sous un utilisateur donné. */
export const runToolAs = (
  principalId: string,
  name: ToolName,
  definition: AnyToolDefinition,
  input: unknown,
): Promise<unknown> => {
  const context: ToolContext = runAsUser(principalId, () => ({
    model: 'openweight-large',
    trace: new TurnTrace(),
    runInContext: captureContext(),
  }))
  const tool = toAiTool(name, definition, context)
  return Promise.resolve(
    tool.execute?.(input, { toolCallId: 't', messages: [], context: undefined }),
  )
}

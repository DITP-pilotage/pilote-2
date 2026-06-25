import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { errAsync, ResultAsync } from 'neverthrow'
import { type z } from 'zod'

import { env } from '@/env'

const ALBERT_BASE_URL = 'https://albert.api.etalab.gouv.fr/v1'
const ALBERT_MODEL = 'openweight-large'

export type AlbertGenerateError =
  | { type: 'ALBERT_NON_CONFIGURE' }
  | { type: 'ALBERT_UNAVAILABLE'; cause: unknown }

export const generateStructuredOutput = <Schema extends z.ZodType>({
  schema,
  systemPrompt,
  prompt,
}: {
  schema: Schema
  systemPrompt: string
  prompt: string
}): ResultAsync<z.infer<Schema>, AlbertGenerateError> => {
  const apiKey = env.ALBERT_API_KEY
  if (!apiKey) {
    return errAsync<z.infer<Schema>, AlbertGenerateError>({ type: 'ALBERT_NON_CONFIGURE' })
  }

  const provider = createOpenAI({ baseURL: ALBERT_BASE_URL, apiKey })

  return ResultAsync.fromPromise(
    generateObject({
      model: provider.chat(ALBERT_MODEL),
      system: systemPrompt,
      prompt,
      schema,
      temperature: 0,
    }).then((result) => result.object as z.infer<Schema>),
    (cause): AlbertGenerateError => ({ type: 'ALBERT_UNAVAILABLE', cause }),
  )
}

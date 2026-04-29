import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { z, ZodType } from 'zod'

const jsonResponse = <S extends ZodType, Status extends ContentfulStatusCode>({
  context,
  data,
  schema,
  status,
}: {
  context: Context
  data: z.input<S>
  schema: S
  status: Status
}) => {
  const parsed = schema.parse(data) as z.infer<S>
  return context.json(parsed, status)
}

export const jsonResponseOk = <S extends ZodType, Status extends ContentfulStatusCode>({
  context,
  data,
  schema,
  status,
}: {
  context: Context
  data: z.input<S>
  schema: S
  status: Status
}) => jsonResponse({ context, data, schema, status })

export const jsonResponseError = <S extends ZodType, Status extends ContentfulStatusCode>({
  context,
  error,
  schema,
  status,
}: {
  context: Context
  error: z.input<S>
  schema: S
  status: Status
}) => jsonResponse({ context, data: error, schema, status })

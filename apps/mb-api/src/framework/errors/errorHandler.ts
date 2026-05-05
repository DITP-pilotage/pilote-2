import type { OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'

import { AppError } from '@/framework/errors/AppError'
import type { ErrorKind } from '@/framework/errors/kinds'
import { Prisma } from '@/generated/prisma/client'

const KIND_TO_STATUS: Record<ErrorKind, 400 | 401 | 403 | 404 | 409 | 500 | 501> = {
  'not-found': 404,
  validation: 400,
  conflict: 409,
  forbidden: 403,
  unauthenticated: 401,
  'not-implemented': 501,
  internal: 500,
}

export const mapAppErrorToHttpStatus = (error: AppError) => KIND_TO_STATUS[error.kind]

export const registerErrorHandler = (app: OpenAPIHono): void => {
  app.onError((error, context) => {
    const url = context.req.url
    const method = context.req.method

    if (error instanceof AppError) {
      const status = mapAppErrorToHttpStatus(error)
      const logFn = status >= 500 ? console.error : console.warn
      logFn(`[${method} ${url}] ${error.code}: ${error.message}`)
      return context.json(
        {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        status,
      )
    }

    if (error instanceof HTTPException) {
      console.warn(`[${method} ${url}] HTTPException ${error.status}: ${error.message}`)
      return context.json(
        {
          code:
            error.status === 401
              ? 'UNAUTHENTICATED'
              : error.status === 403
                ? 'FORBIDDEN'
                : 'HTTP_EXCEPTION',
          message: error.message,
        },
        error.status,
      )
    }

    if (error instanceof ZodError) {
      console.warn(`[${method} ${url}] Validation error`, error.issues)
      return context.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Les données fournies sont invalides',
          details: { issues: error.issues },
        },
        400,
      )
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      console.warn(`[${method} ${url}] Prisma not found: ${error.message}`)
      return context.json(
        {
          code: 'ENTITY_NOT_FOUND',
          message: 'Ressource introuvable',
        },
        404,
      )
    }

    console.error(
      `[${method} ${url}] Unhandled error: ${error.message}`,
      error.stack,
    )
    return context.json(
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Une erreur interne est survenue',
      },
      500,
    )
  })

  app.notFound((context) =>
    context.json(
      {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${context.req.method} ${context.req.url} introuvable`,
      },
      404,
    ),
  )
}

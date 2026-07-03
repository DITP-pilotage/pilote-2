import type { OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'

import { AppError } from '@/framework/errors/AppError'
import type { ErrorKind } from '@/framework/errors/kinds'
import { logger } from '@/framework/logger/logger'
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
      const logFn = status >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger)
      logFn({ method, url, code: error.code, status, details: error.details }, error.message)
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
      logger.warn({ method, url, status: error.status }, error.message)
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
      logger.warn({ method, url, issues: error.issues }, 'Validation error')
      return context.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Les données fournies sont invalides',
          details: { issues: error.issues },
        },
        400,
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      logger.warn({ method, url, prismaCode: error.code }, error.message)
      return context.json(
        {
          code: 'ENTITY_NOT_FOUND',
          message: 'Ressource introuvable',
        },
        404,
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      logger.warn({ method, url, prismaCode: error.code }, error.message)
      return context.json(
        {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'Une ressource avec ces valeurs existe déjà',
        },
        409,
      )
    }

    logger.error({ method, url, err: error }, 'Unhandled error')
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

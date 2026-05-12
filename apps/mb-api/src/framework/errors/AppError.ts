import type { ErrorKind } from '@/framework/errors/kinds'

export abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly kind: ErrorKind
  readonly details: Record<string, unknown> | undefined

  constructor(message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.details = details
  }
}

export class EntityNotFoundError extends AppError {
  readonly code = 'ENTITY_NOT_FOUND'
  readonly kind = 'not-found' as const
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN'
  readonly kind = 'forbidden' as const
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly kind = 'validation' as const
}

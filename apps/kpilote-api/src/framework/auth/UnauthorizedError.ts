import { AppError } from '@/framework/errors/AppError'

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHENTICATED'
  readonly kind = 'unauthenticated' as const
}

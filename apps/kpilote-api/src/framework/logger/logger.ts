import { env } from '@/env'
import { buildLogger } from '@/framework/logger/build-logger'

export interface Logger {
  debug(context: Record<string, unknown>, message: string): void
  info(context: Record<string, unknown>, message: string): void
  warn(context: Record<string, unknown>, message: string): void
  error(context: Record<string, unknown>, message: string): void
}

export const logger: Logger = buildLogger(env)

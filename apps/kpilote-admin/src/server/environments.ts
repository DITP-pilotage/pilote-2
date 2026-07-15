import { serverEnv } from '@/server/env'

export const ENVIRONMENTS = ['local', 'dev', 'prod'] as const
export type Environment = (typeof ENVIRONMENTS)[number]

export const isEnvironment = (value: unknown): value is Environment =>
  typeof value === 'string' && (ENVIRONMENTS as readonly string[]).includes(value)

const URL_BY_ENVIRONMENT: Record<Environment, string> = {
  local: serverEnv.API_BASE_URL_LOCAL,
  dev: serverEnv.API_BASE_URL_DEV,
  prod: serverEnv.API_BASE_URL_PROD,
}

export const kpiloteApiUrlFor = (environment: Environment): string =>
  URL_BY_ENVIRONMENT[environment]

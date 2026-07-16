import { createContext, type ReactNode, useContext, useMemo } from 'react'

import type { Environment } from '@/session'

export type AppConfig = {
  isProd: boolean
  environment: Environment | null
}

const AppConfigContext = createContext<AppConfig | null>(null)

export function AppConfigProvider({
  environment,
  children,
}: {
  environment: Environment | null
  children: ReactNode
}) {
  const value = useMemo<AppConfig>(
    () => ({ environment, isProd: environment === 'prod' }),
    [environment],
  )
  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
}

export function useAppConfig(): AppConfig {
  const config = useContext(AppConfigContext)
  if (!config) throw new Error('useAppConfig doit être utilisé dans AppConfigProvider')
  return config
}

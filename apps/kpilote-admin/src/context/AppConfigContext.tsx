import { createContext, type ReactNode, useContext, useMemo } from 'react'

export type AppConfig = {
  isProd: boolean
}

const AppConfigContext = createContext<AppConfig | null>(null)

export function AppConfigProvider({ isProd, children }: { isProd: boolean; children: ReactNode }) {
  const value = useMemo<AppConfig>(() => ({ isProd }), [isProd])
  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
}

export function useAppConfig(): AppConfig {
  const config = useContext(AppConfigContext)
  if (!config) throw new Error('useAppConfig doit être utilisé dans AppConfigProvider')
  return config
}

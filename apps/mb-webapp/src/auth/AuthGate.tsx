import { type ReactNode, useEffect, useState } from 'react'

import { bootstrapSession } from '@/auth/bootstrap'

type Status = 'pending' | 'authenticated'

type Props = {
  children: ReactNode
}

export const AuthGate = ({ children }: Props) => {
  const [status, setStatus] = useState<Status>('pending')

  useEffect(() => {
    let cancelled = false
    void bootstrapSession().then(({ authenticated }) => {
      if (cancelled) return
      if (!authenticated) {
        window.location.assign('/auth/login')
        return
      }
      setStatus('authenticated')
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'pending') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <p className="text-slate-500">Chargement…</p>
      </main>
    )
  }

  return <>{children}</>
}

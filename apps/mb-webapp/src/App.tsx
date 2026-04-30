import { SHARED_GREETING } from '@pilote/mb-shared'
import { useQuery } from '@tanstack/react-query'

import { fetchSharedMessage } from '@/api/sharedMessage'

export const App = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['shared-message'],
    queryFn: fetchSharedMessage,
  })

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Pilote MB</h1>
        <p className="mt-3 text-base text-slate-600">Webapp Marque Blanche — squelette initial.</p>

        <pre className="mt-6 rounded bg-slate-900 p-4 text-left text-sm text-slate-100">
          {SHARED_GREETING}
        </pre>

        <pre className="mt-4 rounded bg-slate-100 p-4 text-left text-sm text-slate-800">
          {isPending && 'Chargement…'}
          {isError && `Erreur: ${error.message}`}
          {data && data.greeting}
        </pre>
      </div>
    </main>
  )
}

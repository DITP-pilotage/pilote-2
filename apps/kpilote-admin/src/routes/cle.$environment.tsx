import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@pilote/kpilote-ui/Button'
import { type Environment, session } from '@/session'

const ENV_LABEL: Record<Environment, string> = { local: 'Local', dev: 'Dev', prod: 'Prod' }
const isEnvironment = (value: string): value is Environment =>
  value === 'local' || value === 'dev' || value === 'prod'

export const Route = createFileRoute('/cle/$environment')({
  beforeLoad: ({ params, context }) => {
    if (!isEnvironment(params.environment)) throw redirect({ to: '/' })
    if (context.session.current) throw redirect({ to: '/fonctionnalites' })
  },
  component: KeyComponent,
})

function KeyComponent() {
  const { environment } = Route.useParams()
  const env = environment as Environment
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isProd = env === 'prod'

  const rememberedQuery = useQuery({
    queryKey: ['remembered'],
    queryFn: () => session.remembered(),
  })
  const remembered = rememberedQuery.data?.[env]

  const errorMessageFor = (code: string | undefined): string =>
    code === 'invalid_key'
      ? `Clé invalide pour l'environnement ${ENV_LABEL[env]}.`
      : code === 'environment_unreachable'
        ? `Environnement ${ENV_LABEL[env]} injoignable.`
        : 'Une erreur est survenue.'

  const submit = async () => {
    setPending(true)
    setError(null)
    const result = await session.confirm(env, apiKey.trim())
    if (result.ok) {
      window.location.assign('/fonctionnalites')
      return
    }
    setPending(false)
    setError(errorMessageFor(result.error))
  }

  const continueWithRemembered = async () => {
    setPending(true)
    setError(null)
    const result = await session.useRemembered(env)
    if (result.ok) {
      window.location.assign('/fonctionnalites')
      return
    }
    setPending(false)
    // La clé mémorisée a pu être révoquée/expirée : le serveur l'a oubliée.
    await queryClient.invalidateQueries({ queryKey: ['remembered'] })
    setError(
      result.error === 'invalid_key'
        ? `La clé mémorisée n'est plus valide, saisissez-en une nouvelle.`
        : errorMessageFor(result.error),
    )
  }

  const forget = async () => {
    await session.forget(env)
    await queryClient.invalidateQueries({ queryKey: ['remembered'] })
  }

  return (
    <div className="mx-auto grid max-w-3xl overflow-hidden rounded-xl border border-border sm:grid-cols-2">
      <div
        className={`flex flex-col justify-center p-8 text-white ${isProd ? 'bg-red-marianne' : 'bg-primary'}`}
      >
        <div className="text-xs font-bold uppercase tracking-widest opacity-70">Environnement</div>
        <div className="mt-2 text-2xl font-extrabold">{ENV_LABEL[env]}</div>
        <p className="mt-3 text-sm opacity-90">
          {isProd
            ? 'Attention : vous configurez la PRODUCTION. Les modifications seront appliquées sur les données réelles.'
            : 'Saisissez la clé API de cet environnement pour démarrer.'}
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: '/' })}
          className="mt-5 self-start text-xs font-semibold underline opacity-80 hover:opacity-100"
        >
          ← Changer d'environnement
        </button>
      </div>
      <div className="flex flex-col justify-center gap-3 p-8">
        <label htmlFor="apiKey" className="text-xs font-semibold">
          Clé API
        </label>
        <input
          id="apiKey"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="pilote_live_…"
          className="rounded-md border border-border px-3 py-2.5 font-mono text-sm focus:border-primary focus:outline-none"
        />
        {error ? <p className="text-sm font-medium text-red-marianne">{error}</p> : null}
        <Button
          type="button"
          disabled={pending || apiKey.trim().length === 0}
          onClick={() => void submit()}
        >
          {pending ? 'Validation…' : 'Confirmer la clé'}
        </Button>

        {remembered ? (
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <Button
              variant="secondary"
              type="button"
              disabled={pending}
              onClick={() => void continueWithRemembered()}
            >
              <KeyRound className="size-4" />
              Continuer avec « {remembered.label} » ({remembered.prefix}…)
            </Button>
            <button
              type="button"
              onClick={() => void forget()}
              className="self-end text-xs text-text-subtle underline hover:text-red-marianne"
            >
              Oublier cette clé
            </button>
          </div>
        ) : null}

        <p className="text-xs text-text-subtle">
          🔒 La clé est validée puis stockée chiffrée côté serveur, jamais exposée au navigateur.
        </p>
      </div>
    </div>
  )
}

import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { z } from 'zod'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/indicateurs', search: {} })
    }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const { auth } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()

  const handleLogin = () => {
    auth.login()
    if (search.redirect) {
      router.history.push(search.redirect)
    } else {
      void navigate({ to: '/indicateurs', search: {} })
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <p className="mt-2 text-sm text-slate-600">
          Auth simulée — un faux utilisateur sera créé. ProConnect remplacera
          cette implémentation plus tard.
        </p>
      </header>

      <div className="rounded border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-700">
          Vous serez connecté en tant que :
        </p>
        <p className="mt-1 font-medium">Marie Curie</p>
        <p className="text-sm text-slate-500">marie@pilote-mb.fr</p>

        <button
          type="button"
          onClick={handleLogin}
          className="mt-4 w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Se connecter
        </button>
      </div>

      <div className="rounded border border-slate-200 bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>✓ beforeLoad redirect fonctionnel (si déjà connecté → redirect)</li>
          <li>
            search.redirect (cible post-login) :{' '}
            <code>{search.redirect ?? '(vide → /indicateurs)'}</code>
          </li>
        </ul>
      </div>
    </div>
  )
}

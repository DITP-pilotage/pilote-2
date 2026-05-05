import { createFileRoute } from '@tanstack/react-router'

import { auth } from '@/auth'

export const Route = createFileRoute('/auth/login-error')({
  component: LoginErrorPage,
})

function LoginErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Accès refusé</h1>
      <p className="text-gray-700">
        Votre compte n'est pas autorisé à accéder à cette application.
        Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <button
        type="button"
        onClick={() => {
          void auth.logout()
        }}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        Se déconnecter
      </button>
    </main>
  )
}

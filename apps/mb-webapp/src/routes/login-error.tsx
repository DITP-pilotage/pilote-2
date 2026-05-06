import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/Button'
import { auth } from '@/auth'

export const Route = createFileRoute('/login-error')({
  component: LoginErrorPage,
})

function LoginErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold text-text">Accès refusé</h1>
      <p className="text-text-muted">
        Votre compte n'est pas autorisé à accéder à cette application. Contactez votre
        administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <Button
        type="button"
        onClick={() => {
          void auth.logout()
        }}
      >
        Se déconnecter
      </Button>
    </main>
  )
}

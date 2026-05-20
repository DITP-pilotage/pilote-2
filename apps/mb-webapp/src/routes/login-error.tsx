import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Section } from '@/components/ui/Section'
import { auth } from '@/auth'

export const Route = createFileRoute('/login-error')({
  component: LoginErrorPage,
})

function LoginErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4">
      <Section>
        <div className="space-y-6 text-center">
          <EmptyState
            title="Accès refusé"
            description="Votre compte n'est pas autorisé à accéder à cette application. Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur."
          />
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => {
                void auth.logout()
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </Section>
    </main>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Heading, Text } from '@/components/ui/Typography'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
})

function LoginPage() {
  const { auth } = Route.useRouteContext()
  const { redirect } = Route.useSearch()

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <Section>
          <div className="space-y-8 text-center">
            <div className="space-y-2">
              <Heading as="h1" size="xl">
                Connexion
              </Heading>
              <Text tone="muted">Choisissez votre méthode de connexion.</Text>
            </div>

            <div className="flex flex-col gap-3">
              <Button size="lg" type="button" onClick={() => auth.login(redirect, 'proconnect')}>
                Se connecter avec ProConnect
              </Button>

              <Button
                variant="secondary"
                size="lg"
                type="button"
                onClick={() => auth.login(redirect, 'keycloak')}
              >
                Se connecter avec Keycloak
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

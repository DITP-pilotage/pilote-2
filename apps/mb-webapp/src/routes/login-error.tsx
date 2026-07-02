import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Section } from '@/components/ui/Section'
import { auth } from '@/auth'

const reasonSchema = z.enum([
  'user_not_found',
  'invalid_state',
  'callback_failed',
  'missing_tokens',
  'missing_access_token',
  'me_failed',
])
type Reason = z.infer<typeof reasonSchema>

const loginErrorSearchSchema = z.object({
  reason: reasonSchema.optional(),
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login-error')({
  validateSearch: loginErrorSearchSchema,
  component: LoginErrorPage,
})

type ErrorContent = {
  title: string
  description: string
  action: 'logout' | 'retry'
}

const GENERIC_ERROR: ErrorContent = {
  title: 'Une erreur est survenue',
  description: "L'authentification a échoué. Merci de réessayer.",
  action: 'retry',
}

const CONTENT_BY_REASON: Record<Reason | 'default', ErrorContent> = {
  user_not_found: {
    title: 'Accès refusé',
    description:
      "Votre compte n'est pas autorisé à accéder à cette application. Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.",
    action: 'logout',
  },
  invalid_state: {
    title: 'Session expirée',
    description:
      'Votre session a expiré ou votre navigateur a bloqué nos cookies. Merci de vous reconnecter.',
    action: 'retry',
  },
  callback_failed: GENERIC_ERROR,
  missing_tokens: GENERIC_ERROR,
  missing_access_token: GENERIC_ERROR,
  me_failed: GENERIC_ERROR,
  default: GENERIC_ERROR,
}

function LoginErrorPage() {
  const { reason, redirect } = Route.useSearch()
  const navigate = useNavigate()
  const content = CONTENT_BY_REASON[reason ?? 'default']

  const handleClick = () => {
    if (content.action === 'logout') {
      void auth.logout()
      return
    }
    void navigate({ to: '/login', search: redirect ? { redirect } : {} })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4">
      <Section>
        <div className="space-y-6 text-center">
          <EmptyState title={content.title} description={content.description} />
          <div className="flex justify-center">
            <Button type="button" onClick={handleClick}>
              {content.action === 'logout' ? 'Se déconnecter' : 'Se reconnecter'}
            </Button>
          </div>
        </div>
      </Section>
    </main>
  )
}

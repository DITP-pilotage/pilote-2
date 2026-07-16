import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { FlaskConical, Laptop, Siren } from 'lucide-react'

import { BarCard } from '@/components/ui/BarCard'
import { FadeIn } from '@pilote/kpilote-ui/FadeIn'
import type { Environment } from '@/session'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.session.current) throw redirect({ to: '/fonctionnalites' })
  },
  component: LandingComponent,
})

function LandingComponent() {
  const navigate = useNavigate()
  const go = (environment: Environment) => {
    void navigate({ to: '/cle/$environment', params: { environment } })
  }

  return (
    <div className="flex flex-col items-center">
      <FadeIn>
        <h1 className="max-w-xl text-center text-3xl font-extrabold leading-tight">
          Sur quel environnement souhaitez-vous travailler&nbsp;?
        </h1>
        <p className="mt-3 text-center text-text-muted">
          Sélectionnez la cible de vos modifications.
        </p>
      </FadeIn>
      <div className="mt-9 flex flex-wrap justify-center gap-6">
        <FadeIn delayMs={60}>
          <BarCard
            icon={Laptop}
            title="Local"
            description="Votre machine de développement. Idéal pour tester sans risque."
            onClick={() => go('local')}
          />
        </FadeIn>
        <FadeIn delayMs={120}>
          <BarCard
            icon={FlaskConical}
            title="Dev"
            description="Environnement de recette partagé par l'équipe."
            onClick={() => go('dev')}
          />
        </FadeIn>
        <FadeIn delayMs={180}>
          <BarCard
            icon={Siren}
            tone="danger"
            topRibbon="⚠ Données réelles"
            title="Prod"
            description={
              <>
                Production. Toute modification est appliquée <b>immédiatement</b> en réel.
              </>
            }
            onClick={() => go('prod')}
          />
        </FadeIn>
      </div>
    </div>
  )
}

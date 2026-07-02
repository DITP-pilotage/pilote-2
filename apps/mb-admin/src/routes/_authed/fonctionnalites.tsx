import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BarChart3, FolderTree, KeyRound } from 'lucide-react'

import { BarCard } from '@/components/ui/BarCard'
import { FadeIn } from '@/components/ui/FadeIn'

export const Route = createFileRoute('/_authed/fonctionnalites')({ component: FeaturesComponent })

function FeaturesComponent() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center">
      <FadeIn>
        <h1 className="text-center text-3xl font-extrabold">Que souhaitez-vous gérer&nbsp;?</h1>
      </FadeIn>
      <div className="mt-9 flex flex-wrap justify-center gap-6">
        <FadeIn delayMs={60}>
          <BarCard
            icon={BarChart3}
            title="Gérer les indicateurs"
            description="Créer ou modifier un indicateur et ses référentiels liés."
            onClick={() => void navigate({ to: '/indicateurs' })}
          />
        </FadeIn>
        <FadeIn delayMs={120}>
          <BarCard
            icon={FolderTree}
            title="Gérer les référentiels"
            description="Créer ou modifier un référentiel et ses individus."
            onClick={() => void navigate({ to: '/referentiels' })}
          />
        </FadeIn>
        <FadeIn delayMs={180}>
          <BarCard
            icon={KeyRound}
            title="Gérer les clés API"
            description="Créer, lister et révoquer les clés API (réservé aux clés ADMIN)."
            onClick={() => void navigate({ to: '/api-keys' })}
          />
        </FadeIn>
      </div>
    </div>
  )
}

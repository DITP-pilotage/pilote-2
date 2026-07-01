import { CloudSun, MessageSquare, Target } from 'lucide-react'
import { Suspense } from 'react'

import { type PanierCommentaireType } from '@/api/commentaires'
import { SectionCommentaire } from '@/components/commentaires/SectionCommentaire'
import { RouteLoading } from '@/components/RouteLoading'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

export function PanierCommentairesTab({
  type,
  onTypeChange,
}: {
  type: PanierCommentaireType
  onTypeChange: (type: PanierCommentaireType) => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <SegmentedControl
          aria-label="Famille de commentaires"
          value={type}
          onValueChange={onTypeChange}
          options={[
            { value: 'OBJECTIF', label: 'Objectifs', icon: <Target /> },
            { value: 'CONFIANCE', label: 'Synthèse des résultats', icon: <CloudSun /> },
            { value: 'DEFAUT', label: 'Autres commentaires', icon: <MessageSquare /> },
          ]}
        />
      </div>

      <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
        <SectionCommentaire key={type} type={type} />
      </Suspense>
    </div>
  )
}

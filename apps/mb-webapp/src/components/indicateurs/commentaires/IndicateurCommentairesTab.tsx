import { CloudSun, MessageSquare } from 'lucide-react'
import { Suspense } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { SectionAutresCommentaires } from '@/components/indicateurs/commentaires/SectionAutresCommentaires'
import { SectionSyntheseDesResultats } from '@/components/indicateurs/commentaires/SectionSyntheseDesResultats'
import { RouteLoading } from '@/components/RouteLoading'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

export function IndicateurCommentairesTab({
  type,
  onTypeChange,
}: {
  type: IndicateurIndividuCommentaireType
  onTypeChange: (type: IndicateurIndividuCommentaireType) => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <SegmentedControl
          aria-label="Famille de commentaires"
          value={type}
          onValueChange={onTypeChange}
          options={[
            { value: 'CONFIANCE', label: 'Synthèse des résultats', icon: <CloudSun /> },
            { value: 'DEFAUT', label: 'Autres commentaires', icon: <MessageSquare /> },
          ]}
        />
      </div>

      <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
        {type === 'CONFIANCE' ? <SectionSyntheseDesResultats /> : <SectionAutresCommentaires />}
      </Suspense>
    </div>
  )
}

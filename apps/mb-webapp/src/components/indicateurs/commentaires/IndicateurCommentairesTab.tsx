import { CloudSun, MessageSquare } from 'lucide-react'
import { Suspense, useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { SectionAutresCommentaires } from '@/components/indicateurs/commentaires/SectionAutresCommentaires'
import { SectionMeteoSynthese } from '@/components/indicateurs/commentaires/SectionMeteoSynthese'
import { RouteLoading } from '@/components/RouteLoading'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

export function IndicateurCommentairesTab({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const [type, setType] = useState<IndicateurIndividuCommentaireType>('CONFIANCE')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <SegmentedControl
          aria-label="Famille de commentaires"
          value={type}
          onValueChange={(value) => setType(value)}
          options={[
            { value: 'CONFIANCE', label: 'Météo & synthèse des résultats', icon: <CloudSun /> },
            { value: 'DEFAUT', label: 'Autres commentaires', icon: <MessageSquare /> },
          ]}
        />
      </div>

      <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
        {type === 'CONFIANCE' ? (
          <SectionMeteoSynthese indicateurId={indicateurId} individuId={individuId} />
        ) : (
          <SectionAutresCommentaires indicateurId={indicateurId} individuId={individuId} />
        )}
      </Suspense>
    </div>
  )
}

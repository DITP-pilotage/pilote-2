import { type DernierNiveauConfianceApiModel } from '@pilote/kpilote-shared/niveauConfiance'

import {
  iconeMeteoIndice,
  niveauConfianceFromIndice,
} from '@/components/commentaires/niveauConfianceAffichage'
import { Text } from '@pilote/kpilote-ui/Typography'

export function IndicateurCardConfiance({
  dernierNiveau,
}: {
  dernierNiveau: DernierNiveauConfianceApiModel | null
}) {
  return (
    <div className="border-t border-border pt-4">
      <Text variant="kicker" tone="muted" as="p">
        Indice de confiance
      </Text>
      {dernierNiveau ? (
        <p className="mt-2 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-text">
          <img
            src={iconeMeteoIndice(dernierNiveau.indice)}
            alt=""
            aria-hidden
            className="h-6 w-auto shrink-0"
          />
          {niveauConfianceFromIndice(dernierNiveau.indice).label}
        </p>
      ) : (
        <Text variant="body" tone="muted" className="mt-2">
          Non renseigné
        </Text>
      )}
    </div>
  )
}

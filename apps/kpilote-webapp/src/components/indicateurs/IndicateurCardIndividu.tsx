import { Text } from '@pilote/kpilote-ui/Typography'
import { findIndividuInStacks, type ReferentielGroup } from '@/lib/individus/hierarchy'

// Individu sur lequel la carte est lue, nommé par son stack (« Territoire : France »).
export function IndicateurCardIndividu({
  groups,
  individuId,
}: {
  groups: ReadonlyArray<ReferentielGroup>
  individuId: string | undefined
}) {
  const individu = individuId ? findIndividuInStacks({ groups, individuId }) : null
  return (
    <Text variant="body" tone="muted">
      {individu ? `${individu.stackNom} : ${individu.individuNom}` : '-'}
    </Text>
  )
}

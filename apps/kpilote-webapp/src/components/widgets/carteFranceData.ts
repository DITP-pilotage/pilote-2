import { parseCelluleId } from '@pilote/kpilote-shared/cellule'
import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { type ValeursRemarquablesContributionApiModel } from '@pilote/kpilote-shared/valeurAvancement'

import { type CartePoint } from '@/components/widgets/CarteFrance'
import { parseJoinValue } from '@/components/widgets/metadata'

type IndividuBindable = {
  individu: IndividuApiModel
  joinValue: string
  valeur: number
}

export type CarteFranceBindings = {
  points: ReadonlyArray<CartePoint>
  individuIdByJoinValue: ReadonlyMap<string, string>
}

const bindIndividu = ({
  individu,
  valeurParIndividu,
  joinKey,
}: {
  individu: IndividuApiModel
  valeurParIndividu: ReadonlyMap<string, number>
  joinKey: string
}): IndividuBindable | null => {
  const joinValue = parseJoinValue({ metadata: individu.metadata, joinKey })
  if (!joinValue) return null
  const valeur = valeurParIndividu.get(individu.id)
  if (valeur === undefined) return null
  return { individu, joinValue, valeur }
}

// Une contribution porte une cellule : l'individu seul (mono) ou, sur une
// tranche multi-dimension, la cellule canonique (ex. DEPT-84~OP-ORANGE). On la
// rattache au membre qui appartient aux individus du widget.
const valeurParMembre = ({
  individus,
  contributions,
}: {
  individus: ReadonlyArray<IndividuApiModel>
  contributions: ReadonlyArray<ValeursRemarquablesContributionApiModel>
}): Map<string, number> => {
  const ids = new Set(individus.map((individu) => individu.id))
  return new Map(
    contributions.flatMap((c) =>
      parseCelluleId(c.individu)
        .filter((membre) => ids.has(membre))
        .map((membre) => [membre, c.valeur] as const),
    ),
  )
}

export const buildCarteFranceBindings = ({
  individus,
  contributions,
  joinKey,
}: {
  individus: ReadonlyArray<IndividuApiModel>
  contributions: ReadonlyArray<ValeursRemarquablesContributionApiModel>
  joinKey: string
}): CarteFranceBindings => {
  const valeurParIndividu = valeurParMembre({ individus, contributions })

  const bindables = individus
    .map((individu) => bindIndividu({ individu, valeurParIndividu, joinKey }))
    .filter((b): b is IndividuBindable => b !== null)

  return {
    points: bindables.map(({ joinValue, valeur, individu }) => ({
      joinValue,
      valeur,
      nom: individu.nom,
    })),
    individuIdByJoinValue: new Map(
      bindables.map(({ joinValue, individu }) => [joinValue, individu.id]),
    ),
  }
}

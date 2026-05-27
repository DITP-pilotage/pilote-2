import { type IndividuApiModel } from '@pilote/mb-shared/individu'
import { type ValeursRemarquablesListApiModel } from '@pilote/mb-shared/valeurAvancement'

import { type CartePoint } from '@/components/widgets/CarteFrance'
import {
  type CodeInseeMetadata,
  parseCodeInseeMetadata,
} from '@/components/widgets/metadata'

type IndividuBindable = {
  individu: IndividuApiModel
  metadata: CodeInseeMetadata
  valeur: number
}

export type CarteFranceBindings = {
  points: ReadonlyArray<CartePoint>
  individuIdByJoinValue: ReadonlyMap<string, string>
}

const buildValeurParIndividu = (
  remarquables: ValeursRemarquablesListApiModel,
  referentielId: string,
): ReadonlyMap<string, number> => {
  const referentiel = remarquables.items.find((r) => r.referentiel === referentielId)
  return new Map(referentiel?.contributions.map((c) => [c.individu, c.valeur]) ?? [])
}

const bindIndividu = (
  individu: IndividuApiModel,
  valeurParIndividu: ReadonlyMap<string, number>,
): IndividuBindable | null => {
  const metadata = parseCodeInseeMetadata(individu.metadata)
  if (!metadata) return null
  const valeur = valeurParIndividu.get(individu.id)
  if (valeur === undefined) return null
  return { individu, metadata, valeur }
}

export const buildCarteFranceBindings = ({
  individus,
  remarquables,
  referentielId,
}: {
  individus: ReadonlyArray<IndividuApiModel>
  remarquables: ValeursRemarquablesListApiModel
  referentielId: string
}): CarteFranceBindings => {
  const valeurParIndividu = buildValeurParIndividu(remarquables, referentielId)

  const bindables = individus
    .map((individu) => bindIndividu(individu, valeurParIndividu))
    .filter((b): b is IndividuBindable => b !== null)

  return {
    points: bindables.map(({ metadata, valeur, individu }) => ({
      joinValue: metadata.codeInsee,
      valeur,
      nom: individu.nom,
    })),
    individuIdByJoinValue: new Map(
      bindables.map(({ metadata, individu }) => [metadata.codeInsee, individu.id]),
    ),
  }
}

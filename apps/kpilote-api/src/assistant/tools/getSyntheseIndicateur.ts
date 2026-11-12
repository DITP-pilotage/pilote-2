import {
  MAX_PERIMETRE_INDIVIDUS,
  PERIMETRE_DESCRIPTION,
  type DatedValue,
  type EntityRef,
  type SyntheseIndicateurOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

import { resolvePerimetre, type ResolvedPerimetre } from '@/assistant/tools/perimetre'
import { type QueryToolDefinition } from '@/assistant/tools/toolDefinition'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { listObjectifsForIndicateur } from '@/objectifIndicateurIndividu/queries/listObjectifsForIndicateur'
import { listSyntheseIndividus } from '@/valeurAvancement/queries/listSyntheseIndividus'
import { listTauxProgressionForIndicateur } from '@/valeurAvancement/queries/listTauxProgressionForIndicateur'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

/** L'indicateur s'il existe et que le principal peut le lire, `null` sinon : l'API ne distingue pas. */
export const findReadableIndicateur = async (id: string): Promise<IndicateurApiModel | null> => {
  try {
    return (await getIndicateurByPublicId(id)).unwrapOr(null)
  } catch {
    return null
  }
}

/** Le point le plus récent de chaque individu. */
const latestByIndividu = <T extends { individu: string }>(
  items: ReadonlyArray<T>,
  dateOf: (item: T) => string,
) => {
  const latest = new Map<string, T>()
  for (const item of items) {
    const current = latest.get(item.individu)
    if (!current || dateOf(item) > dateOf(current)) latest.set(item.individu, item)
  }
  return latest
}

const withoutIndividus = (
  indicateur: SyntheseIndicateurOutput['indicateur'],
  rest: Partial<SyntheseIndicateurOutput>,
): SyntheseIndicateurOutput => ({
  indicateur,
  individus: [],
  valeursRemarquables: [],
  notFound: [],
  ...rest,
})

const readIndividus = async ({
  indicateurId,
  individus,
}: {
  indicateurId: string
  individus: EntityRef[]
}): Promise<SyntheseIndicateurOutput['individus']> => {
  const ids = individus.map((individu) => individu.id)
  const [valeurs, objectifs, taux, synthese] = await Promise.all([
    listValeursForIndicateur(indicateurId, { individus: ids }).unwrapOr({ items: [] }),
    listObjectifsForIndicateur(indicateurId, { individus: ids }).unwrapOr({ items: [] }),
    listTauxProgressionForIndicateur(indicateurId, { individus: ids }).unwrapOr({ items: [] }),
    listSyntheseIndividus(indicateurId, { individus: ids }).unwrapOr({ items: [] }),
  ])
  const derniereValeur = latestByIndividu(valeurs.items, (item) => item.date)
  const objectif = latestByIndividu(objectifs.items, (item) => item.dateCible)
  const dernierTaux = latestByIndividu(taux.items, (item) => item.date)
  const syntheseParIndividu = new Map(synthese.items.map((item) => [item.individu, item]))

  const dated = (valeur: number | undefined, date: string | undefined): DatedValue | null =>
    valeur === undefined || date === undefined ? null : { valeur, date }

  return individus.map((individu) => {
    const valeur = derniereValeur.get(individu.id)
    const cible = objectif.get(individu.id)
    return {
      individu,
      derniereValeur: dated(valeur?.valeur, valeur?.date),
      objectif: dated(cible?.valeurCible, cible?.dateCible),
      tauxProgression: dernierTaux.get(individu.id)?.tauxProgression ?? null,
      variation: syntheseParIndividu.get(individu.id)?.variation ?? null,
      ecartMediane: syntheseParIndividu.get(individu.id)?.ecartMediane ?? null,
    }
  })
}

export const getSyntheseIndicateur: QueryToolDefinition<'get_synthese_indicateur'> = {
  description: `Renvoie l'état d'un indicateur en un appel : identité (nom, unité, référentiels), et pour chaque individu demandé sa dernière valeur, son objectif, son taux de progression, sa variation récente et son écart à la médiane ; plus les valeurs remarquables (min, max, médiane) de chaque référentiel.
- \`notFound\` : identifiants inexistants ou que l'utilisateur ne peut pas consulter ; ne les distingue pas.
- \`truncated\` / \`total\` : le périmètre dépassait ${MAX_PERIMETRE_INDIVIDUS} individus ; dis-le.
- \`needsClarification\` : il manque l'individu ; demande-le à l'utilisateur.
Utilise-le pour : « où en est », l'avancement, l'état ou la comparaison d'un indicateur pour un ou plusieurs individus.
Ne l'utilise pas pour : la série complète dans le temps → get_evolution_indicateur ; une collection → get_synthese_collection.

${PERIMETRE_DESCRIPTION}`,
  execute: async ({ indicateurId, individuId, perimetre }) => {
    const indicateur = await findReadableIndicateur(indicateurId)
    if (!indicateur) return withoutIndividus(null, { notFound: [indicateurId] })

    const identite = {
      id: indicateur.id,
      nom: indicateur.nom,
      unite: indicateur.unite?.libelle ?? null,
      description: indicateur.description,
      referentiels: indicateur.referentiels.map((referentiel) => ({
        id: referentiel.id,
        nom: referentiel.nom,
      })),
    }

    const referentielIds = identite.referentiels.map((referentiel) => referentiel.id)
    const valeursRemarquables =
      referentielIds.length === 0
        ? []
        : (
            await listValeursRemarquablesForIndicateur(indicateurId, {
              referentiels: referentielIds,
            }).unwrapOr({ items: [] })
          ).items.map((item) => ({
            referentiel: identite.referentiels.find(
              (referentiel) => referentiel.id === item.referentiel,
            ) ?? {
              id: item.referentiel,
              nom: item.referentiel,
            },
            min: item.min,
            max: item.max,
            mediane: item.mediane,
          }))

    const cible: ResolvedPerimetre | null = perimetre
      ? await resolvePerimetre(perimetre)
      : individuId
        ? await resolvePerimetre({ type: 'SELECTION', individuIds: [individuId] })
        : null
    if (!cible) {
      return withoutIndividus(identite, {
        valeursRemarquables,
        needsClarification:
          'Les valeurs, objectifs et taux de progression se lisent pour un individu précis, et aucun n’a été désigné.',
      })
    }

    return {
      indicateur: identite,
      individus:
        cible.individus.length === 0
          ? []
          : await readIndividus({ indicateurId, individus: cible.individus }),
      valeursRemarquables,
      notFound: cible.notFound,
      ...(cible.truncated ? { total: cible.total, truncated: true } : {}),
    }
  },
}

import {
  type ListTauxProgressionQuery,
  type TauxProgressionListApiModel,
  type TauxProgressionPointApiModel,
} from '@pilote/mb-shared/tauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import {
  type ObjectifBrut,
  type ValeurBrute,
  resolveTauxProgression,
} from '@/tauxProgression/resolveTauxProgression'

export const listTauxProgressionForIndicateur = (
  indicateurPublicId: string,
  params: ListTauxProgressionQuery,
): ResultAsync<TauxProgressionListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true, publicId: true },
    }),
  ).andThen((indicateur) => ResultAsync.fromSafePromise(buildList({ indicateur, params })))
}

const buildList = async ({
  indicateur,
  params,
}: {
  indicateur: { id: string; publicId: string }
  params: ListTauxProgressionQuery
}): Promise<TauxProgressionListApiModel> => {
  const individusCibles = await loadIndividusParPublicId(params.individus)
  if (individusCibles.length === 0) return { items: [] }

  const individuIds = individusCibles.map((i) => i.id)

  const [rawValeurs, rawObjectifs] = await Promise.all([
    db().valeurAvancement.findMany({
      where: {
        indicateurId: indicateur.id,
        individuId: { in: individuIds },
        ...(params.dateDebut || params.dateFin
          ? {
              date: {
                ...(params.dateDebut ? { gte: params.dateDebut } : {}),
                ...(params.dateFin ? { lte: params.dateFin } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ individuId: 'asc' }, { date: 'asc' }],
    }),
    db().objectifIndicateurIndividu.findMany({
      where: { indicateurId: indicateur.id, individuId: { in: individuIds } },
      orderBy: [{ individuId: 'asc' }, { dateCible: 'asc' }],
    }),
  ])

  const individuParId = new Map(individusCibles.map((i) => [i.id, i]))

  const valeurs: ValeurBrute[] = rawValeurs.flatMap((v) => {
    const individu = individuParId.get(v.individuId)
    if (!individu) return []
    return [
      {
        individuId: v.individuId,
        individuPublicId: individu.publicId,
        date: v.date,
        valeur: v.valeur,
      },
    ]
  })

  const objectifsParIndividu = new Map<string, ObjectifBrut[]>()
  for (const o of rawObjectifs) {
    const liste = objectifsParIndividu.get(o.individuId) ?? []
    liste.push({ dateCible: o.dateCible, valeurCible: o.valeurCible })
    objectifsParIndividu.set(o.individuId, liste)
  }

  const points = resolveTauxProgression({ valeurs, objectifsParIndividu })

  points.sort((a, b) =>
    a.individuPublicId !== b.individuPublicId
      ? a.individuPublicId.localeCompare(b.individuPublicId)
      : a.date.localeCompare(b.date),
  )

  const items: TauxProgressionPointApiModel[] = points.map((p) => ({
    indicateur: indicateur.publicId,
    individu: p.individuPublicId,
    date: p.date,
    valeur: p.valeur.toNumber(),
    valeurCible: p.valeurCible.toNumber(),
    dateCible: p.dateCible,
    tauxProgression: p.tauxProgression,
  }))

  return { items }
}

import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'
import {
  type ContributionApiModel,
  type DateTrunc,
  type ListValeursForIndicateurQuery,
  type ValeurAvancementApiModel,
  type ValeurAvancementListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesPourIndividus } from '@/generated/prisma/sql'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
  type ResolveSerieContext,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieDerivee'

export const listValeursForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursForIndicateurQuery,
): ResultAsync<ValeurAvancementListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    ResultAsync.fromSafePromise(
      buildSeries({ indicateurId: indicateur.id, indicateurPublicId, params }),
    ),
  )
}

const buildSeries = async ({
  indicateurId,
  indicateurPublicId,
  params,
}: {
  indicateurId: string
  indicateurPublicId: string
  params: ListValeursForIndicateurQuery
}): Promise<ValeurAvancementListApiModel> => {
  const cibles = await db().individu.findMany({
    where: { publicId: { in: params.individus } },
    select: { id: true, publicId: true, referentielId: true },
  })
  if (cibles.length === 0) return { items: [] }

  const { allNodes, enfantsParParent } = await loadSousArbre(cibles)
  const fonctionAgregationParReferentiel = await loadFonctionsAgregation(indicateurId)
  const dateTrunc: DateTrunc = params.dateTrunc ?? 'day'
  const serieFeuilleParIndividu = await loadSaisiesTronquees({
    indicateurId,
    individuIds: [...allNodes.keys()],
    dateTrunc,
  })

  const ctx: ResolveSerieContext = {
    enfantsParParent,
    fonctionAgregationParReferentiel,
    serieFeuilleParIndividu,
    referentielParIndividu: new Map(
      [...allNodes.values()].map((ref) => [ref.id, ref.referentielId]),
    ),
  }
  const cache = new Map<string, ReadonlyArray<PointInterne>>()
  const ciblesTriees = [...cibles].sort((a, b) => a.publicId.localeCompare(b.publicId))

  const items: ValeurAvancementApiModel[] = []
  for (const cible of ciblesTriees) {
    const serie = resolveSerieIndividu(cible.id, ctx, cache)
    for (const point of serie) {
      if (params.dateDebut && point.bucket < params.dateDebut) continue
      if (params.dateFin && point.bucket > params.dateFin) continue
      items.push(toApiModel({ indicateurPublicId, individuPublicId: cible.publicId, point }))
    }
  }
  return { items }
}

const loadSousArbre = async (
  cibles: ReadonlyArray<IndividuRef>,
): Promise<{
  allNodes: Map<string, IndividuRef>
  enfantsParParent: Map<string, IndividuRef[]>
}> => {
  const allNodes = new Map<string, IndividuRef>()
  for (const cible of cibles) allNodes.set(cible.id, cible)
  const enfantsParParent = new Map<string, IndividuRef[]>()
  let currentLevel = cibles.map((c) => c.id)

  while (currentLevel.length > 0) {
    const relations = await db().relation.findMany({
      where: { parentId: { in: currentLevel } },
      select: {
        parentId: true,
        child: { select: { id: true, publicId: true, referentielId: true } },
      },
    })
    if (relations.length === 0) break

    const nextLevelSet = new Set<string>()
    for (const relation of relations) {
      const childRef: IndividuRef = {
        id: relation.child.id,
        publicId: relation.child.publicId,
        referentielId: relation.child.referentielId,
      }
      if (!allNodes.has(childRef.id)) {
        allNodes.set(childRef.id, childRef)
        nextLevelSet.add(childRef.id)
      }
      const liste = enfantsParParent.get(relation.parentId) ?? []
      liste.push(childRef)
      enfantsParParent.set(relation.parentId, liste)
    }
    currentLevel = [...nextLevelSet]
  }

  return { allNodes, enfantsParParent }
}

const loadFonctionsAgregation = async (
  indicateurId: string,
): Promise<Map<string, FonctionAgregation>> => {
  const liens = await db().indicateurReferentiel.findMany({
    where: { indicateurId },
    select: { referentielId: true, fonctionAgregation: true },
  })
  return new Map(liens.map((lien) => [lien.referentielId, lien.fonctionAgregation]))
}

const loadSaisiesTronquees = async ({
  indicateurId,
  individuIds,
  dateTrunc,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
}): Promise<Map<string, SaisieTronquee[]>> => {
  if (individuIds.length === 0) return new Map()
  const rows = await db().$queryRawTyped(
    getValeursTronqueesPourIndividus(indicateurId, [...individuIds], dateTrunc),
  )
  const serieFeuilleParIndividu = new Map<string, SaisieTronquee[]>()
  for (const row of rows) {
    if (!row.bucket) continue
    const liste = serieFeuilleParIndividu.get(row.individuId) ?? []
    liste.push({ bucket: row.bucket, dateOrigine: row.dateOrigine, valeur: row.valeur })
    serieFeuilleParIndividu.set(row.individuId, liste)
  }
  return serieFeuilleParIndividu
}

const toApiModel = ({
  indicateurPublicId,
  individuPublicId,
  point,
}: {
  indicateurPublicId: string
  individuPublicId: string
  point: PointInterne
}): ValeurAvancementApiModel => {
  if (point.type === 'saisie') {
    return {
      indicateur: indicateurPublicId,
      individu: individuPublicId,
      date: point.bucket,
      valeur: point.valeur.toNumber(),
      type: 'saisie',
    }
  }
  const contributions: ContributionApiModel[] = point.contributions.map((c) => ({
    individu: c.individuPublicId,
    valeur: c.valeur === null ? null : c.valeur.toNumber(),
    date: c.dateOrigine,
    source: c.source,
  }))
  return {
    indicateur: indicateurPublicId,
    individu: individuPublicId,
    date: point.bucket,
    valeur: point.valeur.toNumber(),
    type: 'derivee',
    fonctionAgregation: point.fonctionAgregation,
    contributions,
    couverture: point.couverture,
  }
}

import {
  type ListSyntheseIndividusQuery,
  type SyntheseIndividusListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { unique } from '@/framework/array'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { computeEcartMediane } from '@/valeurAvancement/computeEcartMediane'
import { groupMedianesByKey, computeMediane } from '@/valeurAvancement/computeMediane'
import { computeVariation } from '@/valeurAvancement/computeVariation'
import {
  loadFonctionsAgregation,
  loadSaisiesTronquees,
  loadSousArbre,
} from '@/valeurAvancement/loadSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
  type ResolveSerieContext,
} from '@/valeurAvancement/resolveSerieDerivee'
import { Decimal } from '@/framework/decimal'

const fetchLatestValeursIndividus = ({
  indicateurId,
  individuPublicIds,
}: {
  indicateurId: string
  individuPublicIds: ReadonlyArray<string>
}) =>
  db().individu.findMany({
    where: { publicId: { in: [...individuPublicIds] } },
    orderBy: { publicId: 'asc' },
    include: {
      valeurs: {
        where: { indicateurId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 2,
      },
    },
  })

const fetchLatestValeursParReferentiel = ({
  indicateurId,
  referentielIds,
}: {
  indicateurId: string
  referentielIds: ReadonlyArray<string>
}) =>
  db().individu.findMany({
    where: {
      referentielId: { in: [...referentielIds] },
      valeurs: { some: { indicateurId } },
    },
    include: {
      valeurs: {
        where: { indicateurId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 1,
      },
    },
  })

const buildSynthese = async (
  indicateurPublicId: string,
  params: ListSyntheseIndividusQuery,
): Promise<SyntheseIndividusListApiModel> => {
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true },
  })

  const cibles = await db().individu.findMany({
    where: { publicId: { in: [...params.individus] } },
    select: { id: true, publicId: true, referentielId: true },
    orderBy: { publicId: 'asc' },
  })
  if (cibles.length === 0) return { items: [] }

  const fonctionAgregationParReferentiel = await loadFonctionsAgregation(indicateur.id)

  const isAgregePourReferentiel = (referentielId: string): boolean => {
    const fn = fonctionAgregationParReferentiel.get(referentielId)
    return fn !== undefined && fn !== 'NONE'
  }

  const ciblesAgregees = cibles.filter((c) => isAgregePourReferentiel(c.referentielId))
  const ciblesSaisie = cibles.filter((c) => !isAgregePourReferentiel(c.referentielId))

  // --- Mode saisie : comportement actuel ---

  const saisieRowsByPublicId = new Map<string, { valeurs: { valeur: Decimal }[] }>()
  const medianeParRefSaisie = new Map<string, number | null>()

  if (ciblesSaisie.length > 0) {
    const saisieRows = await fetchLatestValeursIndividus({
      indicateurId: indicateur.id,
      individuPublicIds: ciblesSaisie.map((c) => c.publicId),
    })
    for (const row of saisieRows) {
      saisieRowsByPublicId.set(row.publicId, { valeurs: row.valeurs })
    }

    const referentielIdsSaisie = unique(ciblesSaisie.map((c) => c.referentielId))
    const populationRows = await fetchLatestValeursParReferentiel({
      indicateurId: indicateur.id,
      referentielIds: referentielIdsSaisie,
    })
    const valeursParRef = populationRows.flatMap((row) =>
      row.valeurs.map((v) => ({ referentielId: row.referentielId, valeur: v.valeur })),
    )
    const medianes = groupMedianesByKey(
      valeursParRef,
      (row) => row.referentielId,
      (row) => row.valeur,
    )
    for (const [refId, mediane] of medianes) {
      medianeParRefSaisie.set(refId, mediane)
    }
  }

  // --- Mode dérivé ---

  const seriesParIndividuId = new Map<string, ReadonlyArray<PointInterne>>()
  const medianeParRefDerivee = new Map<string, number | null>()

  if (ciblesAgregees.length > 0) {
    const aggrRefIds = unique(ciblesAgregees.map((c) => c.referentielId))

    // Tous les individus des référentiels agrégés (pour la médiane).
    const medianeIndividus = await db().individu.findMany({
      where: { referentielId: { in: aggrRefIds } },
      select: { id: true, publicId: true, referentielId: true },
    })

    // Dédoublonnage : union cibles agrégées + individus pour la médiane.
    const toutesCiblesAgregees = new Map<string, IndividuRef>()
    for (const c of ciblesAgregees) toutesCiblesAgregees.set(c.id, c)
    for (const m of medianeIndividus) toutesCiblesAgregees.set(m.id, m)

    const [{ allNodes, enfantsParParent }] = await Promise.all([
      loadSousArbre([...toutesCiblesAgregees.values()]),
    ])

    const serieFeuilleParIndividu = await loadSaisiesTronquees({
      indicateurId: indicateur.id,
      individuIds: [...allNodes.keys()],
      dateTrunc: 'month',
    })

    const ctx: ResolveSerieContext = {
      enfantsParParent,
      fonctionAgregationParReferentiel,
      serieFeuilleParIndividu,
      referentielParIndividu: new Map(
        [...allNodes.values()].map((individu) => [individu.id, individu.referentielId]),
      ),
    }
    const cache = new Map<string, ReadonlyArray<PointInterne>>()

    // Calcul des séries pour les cibles agrégées (cache partagé avec médiane).
    for (const cible of ciblesAgregees) {
      seriesParIndividuId.set(cible.id, resolveSerieIndividu(cible.id, ctx, cache))
    }

    // Calcul de la médiane par référentiel agrégé.
    const valeursParRef = new Map<string, Decimal[]>()
    for (const individu of medianeIndividus) {
      const serie = resolveSerieIndividu(individu.id, ctx, cache)
      if (serie.length === 0) continue
      const dernierPoint = serie[serie.length - 1]!
      const liste = valeursParRef.get(individu.referentielId) ?? []
      liste.push(dernierPoint.valeur)
      valeursParRef.set(individu.referentielId, liste)
    }
    for (const [refId, valeurs] of valeursParRef) {
      medianeParRefDerivee.set(refId, computeMediane(valeurs))
    }
  }

  // --- Construction de la réponse (ordre publicId ASC conservé) ---

  return {
    items: cibles.map((cible) => {
      if (isAgregePourReferentiel(cible.referentielId)) {
        const serie = seriesParIndividuId.get(cible.id) ?? []
        // Les 2 derniers points en ordre DESC (recente, precedente) pour computeVariation.
        const derniers2Desc =
          serie.length >= 2
            ? [serie[serie.length - 1]!, serie[serie.length - 2]!]
            : serie.length === 1
              ? [serie[0]!]
              : []
        const variation = computeVariation(derniers2Desc)
        const dernierPoint = serie.length > 0 ? serie[serie.length - 1] : undefined
        const mediane = medianeParRefDerivee.get(cible.referentielId) ?? null
        return {
          individu: cible.publicId,
          variation,
          ecartMediane: computeEcartMediane(dernierPoint?.valeur, mediane),
        }
      }

      const row = saisieRowsByPublicId.get(cible.publicId)
      const valeurs = row?.valeurs ?? []
      return {
        individu: cible.publicId,
        variation: computeVariation(valeurs),
        ecartMediane: computeEcartMediane(
          valeurs[0]?.valeur,
          medianeParRefSaisie.get(cible.referentielId) ?? null,
        ),
      }
    }),
  }
}

export const listSyntheseIndividus = (
  indicateurPublicId: string,
  params: ListSyntheseIndividusQuery,
): ResultAsync<SyntheseIndividusListApiModel, never> =>
  ResultAsync.fromSafePromise(buildSynthese(indicateurPublicId, params))

import {
  type ListSyntheseIndividusQuery,
  type SyntheseIndividusListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { Decimal } from '@/framework/decimal'
import { computeEcartMediane } from '@/valeurAvancement/computeEcartMediane'
import { computeMediane } from '@/valeurAvancement/computeMediane'
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

  const allRefIds = [...new Set(cibles.map((c) => c.referentielId))]

  // Chargement parallèle : fonctions d'agrégation + tous les membres des référentiels
  // (nécessaires pour la médiane de chaque référentiel).
  const [fonctionAgregationParReferentiel, membresParRef] = await Promise.all([
    loadFonctionsAgregation(indicateur.id),
    db().individu.findMany({
      where: { referentielId: { in: allRefIds } },
      select: { id: true, publicId: true, referentielId: true },
    }),
  ])

  // Dédoublonnage : cibles + membres des référentiels pour la médiane.
  const tousLesIndividus = new Map<string, IndividuRef>()
  for (const c of cibles) tousLesIndividus.set(c.id, c)
  for (const m of membresParRef) tousLesIndividus.set(m.id, m)

  const { allNodes, enfantsParParent } = await loadSousArbre([...tousLesIndividus.values()])
  const serieFeuilleParIndividu = await loadSaisiesTronquees({
    indicateurId: indicateur.id,
    individuIds: [...allNodes.keys()],
    dateTrunc: 'month',
  })

  const ctx: ResolveSerieContext = {
    enfantsParParent,
    fonctionAgregationParReferentiel,
    serieFeuilleParIndividu,
    referentielParIndividu: new Map([...allNodes.values()].map((i) => [i.id, i.referentielId])),
  }
  const cache = new Map<string, ReadonlyArray<PointInterne>>()

  // Médiane par référentiel : dernier point de chaque membre (saisie ou dérivée selon le type).
  const valeursParRef = new Map<string, Decimal[]>()
  for (const membre of membresParRef) {
    const serie = resolveSerieIndividu(membre.id, ctx, cache)
    if (serie.length === 0) continue
    const liste = valeursParRef.get(membre.referentielId) ?? []
    liste.push(serie[serie.length - 1]!.valeur)
    valeursParRef.set(membre.referentielId, liste)
  }
  const medianeParRef = new Map(
    [...valeursParRef.entries()].map(([refId, valeurs]) => [refId, computeMediane(valeurs)]),
  )

  return {
    items: cibles.map((cible) => {
      const serie = resolveSerieIndividu(cible.id, ctx, cache)
      // Ordre DESC : [plus_recent, precedent] — convention de computeVariation.
      const derniers2Desc =
        serie.length >= 2 ? [serie[serie.length - 1]!, serie[serie.length - 2]!] : serie.slice(-1)
      return {
        individu: cible.publicId,
        variation: computeVariation(derniers2Desc),
        ecartMediane: computeEcartMediane(
          derniers2Desc[0]?.valeur,
          medianeParRef.get(cible.referentielId) ?? null,
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

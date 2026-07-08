import { type DateTrunc } from '@pilote/kpilote-shared/dates'

import { parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesPourIndividus } from '@/generated/prisma/sql'
import {
  loadFonctionsAgregation,
  loadSousArbre,
} from '@/indicateur/queries/loadIndicateurIndividuContext'
import {
  type IndividuRef,
  type ResolveSerieContext,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

// Charge en bulk tout ce dont `resolveSerieIndividu` a besoin pour calculer
// une série (dérivée ou feuille) à partir d'un ensemble d'individus cibles :
// le sous-arbre des descendants, les liens indicateur↔référentiel, et les
// saisies tronquées pré-dédoublonnées par bucket (cf. design doc
// `indicateur-derives.md`). Le travail DB est concentré ici pour que le
// functional core reste pur et mémoïsable côté appelant.
export const loadResolveSerieContext = async ({
  indicateurId,
  individusCibles,
  dateTrunc,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
}): Promise<{ ctx: ResolveSerieContext; allNodes: Map<string, IndividuRef> }> => {
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
    loadSousArbre(individusCibles),
    loadFonctionsAgregation(indicateurId),
  ])
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
      [...allNodes.values()].map((individu) => [individu.id, individu.referentielId]),
    ),
  }
  return { ctx, allNodes }
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
    liste.push({
      bucket: parseBucket(row.bucket),
      dateOrigine: parseBucket(row.dateOrigine),
      valeur: row.valeur,
    })
    serieFeuilleParIndividu.set(row.individuId, liste)
  }
  return serieFeuilleParIndividu
}

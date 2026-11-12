import { type DateTrunc } from '@pilote/kpilote-shared/dates'

import { parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesPourIndividus } from '@/generated/prisma/sql'
import {
  loadFonctionsAgregation,
  loadSousArbre,
} from '@/indicateur/queries/loadIndicateurIndividuContext'
import { cleCellule } from '@/valeurAvancement/cellule'
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
//
// Les saisies chargées sont celles d'une seule combinaison, `combinaisonId`,
// passée explicitement (la combinaison vide pour un indicateur sans axe).
export const loadResolveSerieContext = async ({
  indicateurId,
  individusCibles,
  dateTrunc,
  combinaisonId,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
  combinaisonId: string
}): Promise<{ ctx: ResolveSerieContext; allNodes: Map<string, IndividuRef> }> => {
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
    loadSousArbre(individusCibles),
    loadFonctionsAgregation(indicateurId),
  ])
  const serieFeuilleParCellule = await loadSaisiesTronquees({
    indicateurId,
    individuIds: [...allNodes.keys()],
    dateTrunc,
    combinaisonId,
  })

  const ctx: ResolveSerieContext = {
    enfantsParParent,
    fonctionAgregationParReferentiel,
    serieFeuilleParCellule,
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
  combinaisonId,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
  combinaisonId: string
}): Promise<Map<string, SaisieTronquee[]>> => {
  if (individuIds.length === 0) return new Map()
  const rows = await db().$queryRawTyped(
    getValeursTronqueesPourIndividus(indicateurId, [...individuIds], dateTrunc, combinaisonId),
  )
  const serieFeuilleParCellule = new Map<string, SaisieTronquee[]>()
  for (const row of rows) {
    if (!row.bucket) continue
    const cle = cleCellule({ individuId: row.individuId, combinaisonId })
    const liste = serieFeuilleParCellule.get(cle) ?? []
    liste.push({
      bucket: parseBucket(row.bucket),
      dateOrigine: parseBucket(row.dateOrigine),
      valeur: row.valeur,
    })
    serieFeuilleParCellule.set(cle, liste)
  }
  return serieFeuilleParCellule
}

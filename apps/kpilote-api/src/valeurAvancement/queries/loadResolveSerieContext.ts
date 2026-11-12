import { type DateTrunc } from '@pilote/kpilote-shared/dates'

import { buildGrapheAxes, type CombinaisonObservee, type Selection } from '@/axe/calculMarginale'
import { trouverCombinaisonVideId } from '@/axe/combinaison'
import { parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesPourIndividus } from '@/generated/prisma/sql'
import {
  loadFonctionsAgregation,
  loadSousArbre,
} from '@/indicateur/queries/loadIndicateurIndividuContext'
import { buildGrapheTerritoire } from '@/valeurAvancement/buildGrapheTerritoire'
import { cleCellule } from '@/valeurAvancement/cellule'
import {
  type GrapheSerie,
  type IndividuRef,
  type Noeud,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

export type ContexteSerie = {
  graphe: GrapheSerie
  // Nœud à résoudre pour un individu cible ; sans sélection, « Tous » sur
  // chaque axe. Sélection toujours vide pour un indicateur sans axe.
  noeud: (individu: IndividuRef, selection?: Selection) => Noeud
  allNodes: Map<string, IndividuRef>
}

// Charge en bulk tout ce dont le moteur (`resolveSerieNoeud`) a besoin pour
// calculer une série (dérivée ou feuille) à partir d'un ensemble d'individus
// cibles : le sous-arbre des descendants, les liens indicateur↔référentiel, et
// les saisies tronquées pré-dédoublonnées par bucket (cf. design doc
// `indicateur-derives.md`), puis construit le graphe de résolution. Le travail
// DB est concentré ici pour que le functional core reste pur et mémoïsable
// côté appelant.
//
// Aiguillage : un indicateur sans axe garde le calcul historique sur la
// combinaison vide (`buildGrapheTerritoire`) ; un indicateur à axes calcule
// « Tous » et les modalités parentes à partir des combinaisons observées
// (`buildGrapheAxes`, chemin 1).
export const loadResolveSerieContext = async ({
  indicateurId,
  individusCibles,
  dateTrunc,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
}): Promise<ContexteSerie> => {
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel, declarations] =
    await Promise.all([
      loadSousArbre(individusCibles),
      loadFonctionsAgregation(indicateurId),
      db().indicateurAxe.findMany({ where: { indicateurId }, orderBy: { ordre: 'asc' } }),
    ])
  const individuIds = [...allNodes.keys()]

  if (declarations.length === 0) {
    const combinaisonVideId = await trouverCombinaisonVideId()
    const saisies = await loadSaisiesTronquees({
      indicateurId,
      individuIds,
      dateTrunc,
      combinaisonIds: [combinaisonVideId],
    })
    const territoire = buildGrapheTerritoire({
      individus: allNodes.values(),
      enfantsParParent,
      fonctionAgregationParReferentiel,
      saisiesParIndividu: new Map(
        individuIds.flatMap((individuId) => {
          const liste = saisies.get(cleCellule({ individuId, combinaisonId: combinaisonVideId }))
          return liste ? [[individuId, liste] as const] : []
        }),
      ),
      combinaisonId: combinaisonVideId,
    })
    return { graphe: territoire.graphe, noeud: (individu) => territoire.noeud(individu), allNodes }
  }

  const [modalites, observeesParIndividu] = await Promise.all([
    db().modalite.findMany({ where: { axeId: { in: declarations.map((d) => d.axeId) } } }),
    loadCombinaisonsObservees({ indicateurId, individuIds }),
  ])
  const combinaisonIds = [
    ...new Set([...observeesParIndividu.values()].flat().map((o) => o.combinaisonId)),
  ]
  const saisiesParCellule = await loadSaisiesTronquees({
    indicateurId,
    individuIds,
    dateTrunc,
    combinaisonIds,
  })
  const axes = buildGrapheAxes({
    enfantsParParent,
    fonctionAgregationParReferentiel,
    axes: declarations.map((declaration) => ({
      id: declaration.axeId,
      fonction: declaration.fonction,
    })),
    modalites,
    observeesParIndividu,
    saisiesParCellule,
  })
  return { graphe: axes.graphe, noeud: axes.noeud, allNodes }
}

// Combinaisons qui portent au moins une valeur, par individu (cube creux).
const loadCombinaisonsObservees = async ({
  indicateurId,
  individuIds,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
}): Promise<Map<string, CombinaisonObservee[]>> => {
  if (individuIds.length === 0) return new Map()
  const cellules = await db().valeurAvancement.groupBy({
    by: ['individuId', 'combinaisonId'],
    where: { indicateurId, individuId: { in: [...individuIds] } },
  })
  const lignes = await db().combinaisonModalite.findMany({
    where: { combinaisonId: { in: [...new Set(cellules.map((c) => c.combinaisonId))] } },
  })
  const modaliteParAxeParCombinaison = new Map<string, Map<string, string>>()
  for (const ligne of lignes) {
    const parAxe =
      modaliteParAxeParCombinaison.get(ligne.combinaisonId) ?? new Map<string, string>()
    parAxe.set(ligne.axeId, ligne.modaliteId)
    modaliteParAxeParCombinaison.set(ligne.combinaisonId, parAxe)
  }
  const observeesParIndividu = new Map<string, CombinaisonObservee[]>()
  for (const { individuId, combinaisonId } of cellules) {
    const liste = observeesParIndividu.get(individuId) ?? []
    liste.push({
      combinaisonId,
      modaliteParAxe: modaliteParAxeParCombinaison.get(combinaisonId) ?? new Map(),
    })
    observeesParIndividu.set(individuId, liste)
  }
  return observeesParIndividu
}

// Saisies tronquées par cellule (`cleCellule`).
const loadSaisiesTronquees = async ({
  indicateurId,
  individuIds,
  dateTrunc,
  combinaisonIds,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
  combinaisonIds: ReadonlyArray<string>
}): Promise<Map<string, SaisieTronquee[]>> => {
  if (individuIds.length === 0 || combinaisonIds.length === 0) return new Map()
  const rows = await db().$queryRawTyped(
    getValeursTronqueesPourIndividus(indicateurId, [...individuIds], dateTrunc, [
      ...combinaisonIds,
    ]),
  )
  const saisiesParCellule = new Map<string, SaisieTronquee[]>()
  for (const row of rows) {
    if (!row.bucket) continue
    const cle = cleCellule({ individuId: row.individuId, combinaisonId: row.combinaisonId })
    const liste = saisiesParCellule.get(cle) ?? []
    liste.push({
      bucket: parseBucket(row.bucket),
      dateOrigine: parseBucket(row.dateOrigine),
      valeur: row.valeur,
    })
    saisiesParCellule.set(cle, liste)
  }
  return saisiesParCellule
}

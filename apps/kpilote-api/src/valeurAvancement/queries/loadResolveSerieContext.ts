import { type DateTrunc } from '@pilote/kpilote-shared/dates'

import { getEmptyCombinaisonId } from '@/axe/combinaison'
import { parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesPourIndividus } from '@/generated/prisma/sql'
import {
  loadFonctionsAgregation,
  loadSousArbre,
} from '@/indicateur/queries/loadIndicateurIndividuContext'
import { type ModaliteCalcul, type Selection } from '@/axe/modalites'
import { type IndicateurAxeModel, type ModaliteModel } from '@/generated/prisma/models'
import { buildGrapheSerie } from '@/valeurAvancement/buildGrapheSerie'
import { cleCellule, type SaisiesCellule } from '@/valeurAvancement/cellule'
import {
  type GrapheSerie,
  type IndividuRef,
  type Noeud,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieNoeud'

export type ContexteSerie = {
  graphe: GrapheSerie
  // Nœud à résoudre pour un individu cible ; sans sélection, « Tous » sur
  // chaque axe. Sélection toujours vide pour un indicateur sans axe.
  noeud: (params: { individu: IndividuRef; selection?: Selection }) => Noeud
  allNodes: Map<string, IndividuRef>
}

export type AxesIndicateur = {
  declarations: ReadonlyArray<IndicateurAxeModel>
  modalites: ReadonlyArray<ModaliteModel>
}

// Les axes déclarés par l'indicateur, dans leur ordre, et toutes leurs modalités.
export const loadAxesIndicateur = async (indicateurId: string): Promise<AxesIndicateur> => {
  const declarations = await db().indicateurAxe.findMany({
    where: { indicateurId },
    orderBy: { ordre: 'asc' },
  })
  if (declarations.length === 0) return { declarations, modalites: [] }
  const modalites = await db().modalite.findMany({
    where: { axeId: { in: declarations.map((declaration) => declaration.axeId) } },
  })
  return { declarations, modalites }
}

// Charge en bulk tout ce dont le moteur (`resolveSerieNoeud`) a besoin pour
// calculer une série (dérivée ou feuille) à partir d'un ensemble d'individus
// cibles : le sous-arbre des descendants, les liens indicateur↔référentiel, et
// les saisies tronquées pré-dédoublonnées par bucket (cf. design doc
// `indicateur-derives.md`), puis construit le graphe de résolution. Le travail
// DB est concentré ici pour que le functional core reste pur et mémoïsable
// côté appelant.
//
// Un seul constructeur (`buildGrapheSerie`) : un indicateur sans axe n'a que la
// combinaison vide, et le graphe reprend le calcul historique ; un indicateur à
// axes calcule « Tous » et les modalités parentes à partir des combinaisons
// observées (chemin 1).
//
// `axes` : déjà chargés par l'appelant qui en avait besoin avant le calcul, pour ne pas les relire.
export const loadResolveSerieContext = async ({
  indicateurId,
  individusCibles,
  dateTrunc,
  axes,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
  axes?: AxesIndicateur
}): Promise<ContexteSerie> => {
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel, axesIndicateur] =
    await Promise.all([
      loadSousArbre(individusCibles),
      loadFonctionsAgregation(indicateurId),
      axes ?? loadAxesIndicateur(indicateurId),
    ])
  const { declarations } = axesIndicateur
  const individuIds = [...allNodes.keys()]

  const { modalites, cellules, modalitesParCombinaison } =
    declarations.length === 0
      ? await loadCombinaisonVide({ indicateurId, individuIds, dateTrunc })
      : await loadCombinaisonsAxes({
          indicateurId,
          individuIds,
          dateTrunc,
          modalites: axesIndicateur.modalites,
        })

  const { graphe, noeud } = buildGrapheSerie({
    individus: allNodes.values(),
    enfantsParParent,
    fonctionAgregationParReferentiel,
    axes: declarations.map((declaration) => ({
      id: declaration.axeId,
      fonction: declaration.fonction,
    })),
    modalites,
    cellules,
    modalitesParCombinaison,
  })
  return { graphe, noeud, allNodes }
}

type DonneesCombinaisons = {
  modalites: ReadonlyArray<ModaliteCalcul>
  cellules: ReadonlyArray<SaisiesCellule>
  modalitesParCombinaison: ReadonlyMap<string, ReadonlyMap<string, string>>
}

// Indicateur sans axe : les saisies de la combinaison vide seule.
const loadCombinaisonVide = async ({
  indicateurId,
  individuIds,
  dateTrunc,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
}): Promise<DonneesCombinaisons> => {
  const combinaisonId = await getEmptyCombinaisonId()
  const cellules = await loadSaisiesTronquees({
    indicateurId,
    individuIds,
    dateTrunc,
    combinaisonIds: [combinaisonId],
  })
  return { modalites: [], cellules, modalitesParCombinaison: new Map() }
}

// Indicateur à axes : les saisies de toutes ses combinaisons, puis les
// modalités des combinaisons trouvées.
const loadCombinaisonsAxes = async ({
  indicateurId,
  individuIds,
  dateTrunc,
  modalites,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
  modalites: ReadonlyArray<ModaliteModel>
}): Promise<DonneesCombinaisons> => {
  const cellules = await loadSaisiesTronquees({
    indicateurId,
    individuIds,
    dateTrunc,
    combinaisonIds: null,
  })
  const lignes = await db().combinaisonModalite.findMany({
    where: { combinaisonId: { in: [...new Set(cellules.map((c) => c.combinaisonId))] } },
  })
  const modalitesParCombinaison = new Map<string, Map<string, string>>()
  for (const ligne of lignes) {
    const parAxe = modalitesParCombinaison.get(ligne.combinaisonId) ?? new Map<string, string>()
    parAxe.set(ligne.axeId, ligne.modaliteId)
    modalitesParCombinaison.set(ligne.combinaisonId, parAxe)
  }
  return { modalites, cellules, modalitesParCombinaison }
}

// Saisies tronquées, par cellule. `combinaisonIds` à null : toutes les
// combinaisons de l'indicateur.
const loadSaisiesTronquees = async ({
  indicateurId,
  individuIds,
  dateTrunc,
  combinaisonIds,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
  combinaisonIds: ReadonlyArray<string> | null
}): Promise<SaisiesCellule[]> => {
  if (individuIds.length === 0) return []
  const rows = await db().$queryRawTyped(
    getValeursTronqueesPourIndividus(
      indicateurId,
      [...individuIds],
      dateTrunc,
      combinaisonIds === null ? null : [...combinaisonIds],
    ),
  )
  const cellules = new Map<string, SaisiesCellule & { saisies: SaisieTronquee[] }>()
  for (const row of rows) {
    if (!row.bucket) continue
    const cellule = { individuId: row.individuId, combinaisonId: row.combinaisonId }
    const cle = cleCellule(cellule)
    const courante = cellules.get(cle) ?? { ...cellule, saisies: [] }
    courante.saisies.push({
      bucket: parseBucket(row.bucket),
      dateOrigine: parseBucket(row.dateOrigine),
      valeur: row.valeur,
    })
    cellules.set(cle, courante)
  }
  return [...cellules.values()]
}

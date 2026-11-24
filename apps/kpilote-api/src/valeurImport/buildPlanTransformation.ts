import {
  type ColonneRapprochee,
  type PlanImportEvent,
  type PlanTransformation,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'
import { listLibelles } from '@pilote/kpilote-shared/valeurImport/buildPlan'
import { matchLibellesExact } from '@pilote/kpilote-shared/valeurImport/matchLibellesExact'

import { awaitLater } from '@/framework/concurrency'
import { logger } from '@/framework/logger/logger'
import { describeStructure } from '@/valeurImport/albert/describeStructure'
import { type CibleLibelles, matchLibelles } from '@/valeurImport/albert/matchLibelles'
import { type ImportContext } from '@/valeurImport/queries/getImportContext'
import { checkAxesCouverts } from '@/valeurImport/rules'

// Construit le plan de transformation d'un fichier hors format standard, en deux
// étapes fixes : la structure du fichier, puis le rapprochement des libellés de
// chaque colonne. Générateur asynchrone : il produit chaque étape au fil de
// l'eau, puis le plan ou l'échec. Il ne touche pas la base : son contexte est
// chargé par l'appelant.

type Counts = { resolus: number; aVerifier: number }

const countRapprochements = (colonne: ColonneRapprochee): Counts => {
  const statuts = Object.values(colonne.rapprochements).map((rapprochement) => rapprochement.statut)
  const resolus = statuts.filter((statut) => statut === 'RESOLU').length
  return { resolus, aVerifier: statuts.length - resolus }
}

// Le code rapproche seul ce qui correspond exactement ; Albert ne voit que le reste.
const matchColonne = async ({
  tableau,
  colonne,
  cible,
  indicateurNom,
  abortSignal,
}: {
  tableau: TableauSource
  colonne: string
  cible: CibleLibelles
  indicateurNom: string
  abortSignal?: AbortSignal | undefined
}): Promise<ColonneRapprochee> => {
  const libelles = listLibelles({ tableau, colonne })
  const exact = matchLibellesExact({ libelles, candidats: cible.candidats })
  const parLlm = await matchLibelles({
    cible,
    libelles: exact.restants,
    indicateurNom,
    abortSignal,
  })
  return { colonne, rapprochements: { ...exact.rapprochements, ...parLlm } }
}

const describeAxesSansColonne = (noms: ReadonlyArray<string>): string =>
  noms.length > 1
    ? `Le fichier n'a pas de colonne pour les axes ${noms.map((nom) => `« ${nom} »`).join(', ')}. Une valeur se saisit avec une modalité pour chaque axe de l'indicateur.`
    : `Le fichier n'a pas de colonne pour l'axe « ${noms[0] ?? ''} ». Une valeur se saisit avec une modalité pour chaque axe de l'indicateur.`

async function* buildPlan({
  context,
  tableau,
  nomFichier,
  abortSignal,
}: {
  context: ImportContext
  tableau: TableauSource
  nomFichier: string
  abortSignal?: AbortSignal | undefined
}): AsyncGenerator<PlanImportEvent> {
  const { indicateur, cibles } = context

  yield { type: 'ETAPE', etape: { etape: 'STRUCTURE', statut: 'EN_COURS' } }
  const structure = await describeStructure({
    indicateur,
    nomFichier,
    tableau,
    axes: cibles.axes,
    abortSignal,
  })
  if (structure.isErr()) {
    yield { type: 'ECHEC', erreur: structure.error }
    return
  }
  const couverts = checkAxesCouverts({
    colonnesAxes: structure.value.colonnesAxes,
    axes: cibles.axes.map((axe) => axe.id),
  })
  if (couverts.isErr()) {
    const manquants = new Set(couverts.error.axes)
    const noms = cibles.axes.filter((axe) => manquants.has(axe.id)).map((axe) => axe.nom)
    yield {
      type: 'ECHEC',
      erreur: {
        type: 'FICHIER_INEXPLOITABLE',
        motif: 'AXE_SANS_COLONNE',
        axes: couverts.error.axes,
        explication: describeAxesSansColonne(noms),
      },
    }
    return
  }
  const { colonneIndividu, colonnesAxes, valeurs, filtre } = structure.value
  yield { type: 'ETAPE', etape: { etape: 'STRUCTURE', statut: 'TERMINEE', valeurs } }

  // Les colonnes se rapprochent en parallèle : l'attente est celle de la plus
  // longue. Les étapes sont produites dans l'ordre, individus puis axes ; un
  // rapprochement qui échoue avant son tour lève son erreur à son `await`.
  const individuPending = awaitLater(
    matchColonne({
      tableau,
      colonne: colonneIndividu,
      cible: { description: 'des individus (territoires, entités)', candidats: cibles.individus },
      indicateurNom: indicateur.nom,
      abortSignal,
    }),
  )
  // Dans l'ordre des axes de l'indicateur, quel que soit l'ordre donné par Albert.
  const axesPending = cibles.axes.flatMap((axe) => {
    const colonne = colonnesAxes.find((colonneAxe) => colonneAxe.axe === axe.id)?.colonne
    if (colonne === undefined) return []
    const pending = awaitLater(
      matchColonne({
        tableau,
        colonne,
        cible: {
          description: `des modalités de l'axe « ${axe.nom} », et uniquement de cet axe`,
          candidats: axe.modalites,
        },
        indicateurNom: indicateur.nom,
        abortSignal,
      }),
    )
    return [{ axe: axe.id, pending }]
  })

  yield { type: 'ETAPE', etape: { etape: 'INDIVIDUS', statut: 'EN_COURS' } }
  const individu = await individuPending
  yield {
    type: 'ETAPE',
    etape: { etape: 'INDIVIDUS', statut: 'TERMINEE', ...countRapprochements(individu) },
  }

  const axes: PlanTransformation['axes'] = []
  for (const { axe, pending } of axesPending) {
    yield { type: 'ETAPE', etape: { etape: 'AXE', axe, statut: 'EN_COURS' } }
    const rapprochee = await pending
    axes.push({ axe, ...rapprochee })
    yield {
      type: 'ETAPE',
      etape: { etape: 'AXE', axe, statut: 'TERMINEE', ...countRapprochements(rapprochee) },
    }
  }

  yield { type: 'PLAN', plan: { individu, axes, valeurs, ...(filtre ? { filtre } : {}) } }
}

// Albert injoignable, quota dépassé, réponse illisible : l'import échoue
// proprement, par un événement que la webapp sait afficher.
export async function* buildPlanTransformation(params: {
  context: ImportContext
  tableau: TableauSource
  nomFichier: string
  abortSignal?: AbortSignal | undefined
}): AsyncGenerator<PlanImportEvent> {
  try {
    yield* buildPlan(params)
  } catch (error) {
    if (params.abortSignal?.aborted) return
    logger.error({ event: 'valeurImport.buildPlan.erreur', err: error }, 'Import : échec du plan')
    yield {
      type: 'ECHEC',
      erreur: {
        type: 'FICHIER_INEXPLOITABLE',
        motif: 'ASSISTANT_INDISPONIBLE',
        explication:
          "L'assistant IA est momentanément indisponible. Réessayez dans un instant, ou utilisez le format standard.",
      },
    }
  }
}

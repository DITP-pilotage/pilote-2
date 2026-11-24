import { groupBy, mapValues, partition, uniq } from 'es-toolkit'

import { type WarningApplication } from '@/valeurNormalisation/appliquerPlan'
import { type Plan } from '@/valeurNormalisation/calls/decouvrirStructure'
import { type ResolvedLabel } from '@/valeurNormalisation/calls/resolveLabels'
import { type AxeForImport } from '@/valeurNormalisation/queries/listAxesForIndicateur'

export type SelectedAxeColumn = { column: string; axe: AxeForImport }

// Colonnes de structure du plan : elles ne peuvent pas porter un axe.
const structureColumns = (plan: Plan): Set<string> =>
  new Set([
    plan.colonneIndividu,
    ...(plan.layout === 'long'
      ? [plan.colonneDate.nom, plan.colonneValeur]
      : plan.colonnesPivot.map((pivotColumn) => pivotColumn.nom)),
    ...(plan.colonneTypeValeur ? [plan.colonneTypeValeur.nom] : []),
  ])

// Garde, parmi les colonnes d'axe proposées par Albert, celles qui existent
// dans le fichier et ne sont pas des colonnes de structure, au plus une par
// axe. Renvoie une colonne par axe couvert, dans l'ordre des axes, et un
// avertissement par colonne écartée et par axe sans colonne.
export const selectAxeColumns = ({
  plan,
  headers,
  axes,
}: {
  plan: Plan
  headers: ReadonlyArray<string>
  axes: ReadonlyArray<AxeForImport>
}): { columns: SelectedAxeColumn[]; warnings: WarningApplication[] } => {
  const warnings: WarningApplication[] = []
  const headerSet = new Set(headers)
  const structure = structureColumns(plan)
  const columnByAxe = new Map<string, string>()

  // Pourquoi la colonne proposée pour cet axe est écartée, ou null si on la garde.
  const rejectionReason = ({ column, axe }: { column: string; axe: string }): string | null => {
    if (!headerSet.has(column)) return "elle n'existe pas dans le fichier"
    if (structure.has(column)) return "c'est une colonne d'individu, de date ou de valeur"
    const existingColumn = columnByAxe.get(axe)
    if (existingColumn !== undefined) return `l'axe ${axe} a déjà la colonne « ${existingColumn} »`
    if ([...columnByAxe.values()].includes(column)) return 'elle porte déjà un autre axe'
    return null
  }

  for (const { colonne: column, axe } of plan.colonnesAxes ?? []) {
    const reason = rejectionReason({ column, axe })
    if (reason) {
      warnings.push({
        code: 'COLONNE_AXE_IGNOREE',
        message: `Colonne « ${column} » écartée pour l'axe ${axe} : ${reason}.`,
        colonneSource: column,
      })
      continue
    }
    columnByAxe.set(axe, column)
  }

  const columns: SelectedAxeColumn[] = []
  for (const axe of axes) {
    const column = columnByAxe.get(axe.publicId)
    if (column === undefined) {
      warnings.push({
        code: 'AXE_NON_COUVERT',
        message:
          `Aucune colonne du fichier ne porte l'axe « ${axe.nom} » : ` +
          "une valeur se saisit avec une modalité pour chaque axe de l'indicateur.",
      })
      continue
    }
    columns.push({ column, axe })
  }
  return { columns, warnings }
}

// Libellé comparable : sans accents, en minuscules, ponctuation réduite à des espaces.
const normalizeLabel = (label: string): string =>
  label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()

// Rattache sans Albert les libellés qui désignent sans ambiguïté une modalité
// feuille de l'axe, par son publicId ou son nom. Les autres restent à résoudre.
export const matchModalites = ({
  labels,
  modalites,
}: {
  labels: ReadonlyArray<string>
  modalites: ReadonlyArray<{ publicId: string; nom: string }>
}): { mapping: ResolvedLabel[]; remaining: string[] } => {
  // Chaque modalité se reconnaît à son publicId et à son nom normalisés.
  const candidates = modalites.flatMap((modalite) =>
    [normalizeLabel(modalite.publicId), normalizeLabel(modalite.nom)].map((key) => ({
      key,
      publicId: modalite.publicId,
    })),
  )
  const publicIdsByKey = mapValues(
    groupBy(candidates, (candidate) => candidate.key),
    (group) => uniq(group.map((candidate) => candidate.publicId)),
  )
  const publicIdsOf = (label: string) => publicIdsByKey[normalizeLabel(label)] ?? []

  const [matched, remaining] = partition(labels, (label) => publicIdsOf(label).length === 1)
  return {
    mapping: matched.map((label) => ({ libelleSource: label, publicId: publicIdsOf(label)[0]! })),
    remaining,
  }
}

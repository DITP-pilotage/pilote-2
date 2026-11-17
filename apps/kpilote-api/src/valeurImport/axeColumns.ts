import { type WarningApplication } from '@/valeurImport/appliquerPlan'
import { type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { type ResolvedLabel } from '@/valeurImport/calls/resolveLabels'
import { type AxeForImport } from '@/valeurImport/queries/listAxesForIndicateur'

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

  for (const { colonne: column, axe } of plan.colonnesAxes ?? []) {
    const reason = !headerSet.has(column)
      ? "elle n'existe pas dans le fichier"
      : structure.has(column)
        ? "c'est une colonne d'individu, de date ou de valeur"
        : columnByAxe.has(axe)
          ? `l'axe ${axe} a déjà la colonne « ${columnByAxe.get(axe)} »`
          : [...columnByAxe.values()].includes(column)
            ? 'elle porte déjà un autre axe'
            : null
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
  const candidatesByKey = new Map<string, Set<string>>()
  for (const modalite of modalites) {
    for (const key of [normalizeLabel(modalite.publicId), normalizeLabel(modalite.nom)]) {
      candidatesByKey.set(key, (candidatesByKey.get(key) ?? new Set()).add(modalite.publicId))
    }
  }
  const mapping: ResolvedLabel[] = []
  const remaining: string[] = []
  for (const label of labels) {
    const candidates = candidatesByKey.get(normalizeLabel(label))
    if (candidates?.size === 1) {
      mapping.push({ libelleSource: label, publicId: [...candidates][0]! })
    } else {
      remaining.push(label)
    }
  }
  return { mapping, remaining }
}

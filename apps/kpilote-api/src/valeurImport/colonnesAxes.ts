import { type WarningApplication } from '@/valeurImport/appliquerPlan'
import { type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { type LibelleResolu } from '@/valeurImport/calls/resoudreLibelles'
import { type AxePourImport } from '@/valeurImport/queries/listAxesForIndicateur'

export type ColonneAxeRetenue = { colonne: string; axe: AxePourImport }

// Colonnes de structure du plan : elles ne peuvent pas porter un axe.
const colonnesDeStructure = (plan: Plan): Set<string> =>
  new Set([
    plan.colonneIndividu,
    ...(plan.layout === 'long'
      ? [plan.colonneDate.nom, plan.colonneValeur]
      : plan.colonnesPivot.map((colonne) => colonne.nom)),
    ...(plan.colonneTypeValeur ? [plan.colonneTypeValeur.nom] : []),
  ])

// Garde, parmi les colonnes d'axe proposées par Albert, celles qui existent
// dans le fichier et ne sont pas des colonnes de structure, au plus une par
// axe. Renvoie une colonne par axe couvert, dans l'ordre des axes, et un
// avertissement par colonne écartée et par axe sans colonne.
export const retenirColonnesAxes = ({
  plan,
  headers,
  axes,
}: {
  plan: Plan
  headers: ReadonlyArray<string>
  axes: ReadonlyArray<AxePourImport>
}): { colonnes: ColonneAxeRetenue[]; warnings: WarningApplication[] } => {
  const warnings: WarningApplication[] = []
  const headersSet = new Set(headers)
  const structure = colonnesDeStructure(plan)
  const colonneParAxe = new Map<string, string>()

  for (const { colonne, axe } of plan.colonnesAxes ?? []) {
    const raison = !headersSet.has(colonne)
      ? "elle n'existe pas dans le fichier"
      : structure.has(colonne)
        ? "c'est une colonne d'individu, de date ou de valeur"
        : colonneParAxe.has(axe)
          ? `l'axe ${axe} a déjà la colonne « ${colonneParAxe.get(axe)} »`
          : [...colonneParAxe.values()].includes(colonne)
            ? 'elle porte déjà un autre axe'
            : null
    if (raison) {
      warnings.push({
        code: 'COLONNE_AXE_IGNOREE',
        message: `Colonne « ${colonne} » écartée pour l'axe ${axe} : ${raison}.`,
        colonneSource: colonne,
      })
      continue
    }
    colonneParAxe.set(axe, colonne)
  }

  const colonnes: ColonneAxeRetenue[] = []
  for (const axe of axes) {
    const colonne = colonneParAxe.get(axe.publicId)
    if (colonne === undefined) {
      warnings.push({
        code: 'AXE_NON_COUVERT',
        message:
          `Aucune colonne du fichier ne porte l'axe « ${axe.nom} » : ` +
          "une valeur se saisit avec une modalité pour chaque axe de l'indicateur.",
      })
      continue
    }
    colonnes.push({ colonne, axe })
  }
  return { colonnes, warnings }
}

// Libellé comparable : sans accents, en minuscules, ponctuation réduite à des espaces.
const normaliser = (libelle: string): string =>
  libelle
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()

// Rattache sans Albert les libellés qui désignent sans ambiguïté une modalité
// feuille de l'axe, par son publicId ou son nom. Les autres restent à résoudre.
export const rapprocherModalites = ({
  libelles,
  modalites,
}: {
  libelles: ReadonlyArray<string>
  modalites: ReadonlyArray<{ publicId: string; nom: string }>
}): { mapping: LibelleResolu[]; restants: string[] } => {
  const candidats = new Map<string, Set<string>>()
  for (const modalite of modalites) {
    for (const cle of [normaliser(modalite.publicId), normaliser(modalite.nom)]) {
      candidats.set(cle, (candidats.get(cle) ?? new Set()).add(modalite.publicId))
    }
  }
  const mapping: LibelleResolu[] = []
  const restants: string[] = []
  for (const libelle of libelles) {
    const trouves = candidats.get(normaliser(libelle))
    if (trouves?.size === 1) mapping.push({ libelleSource: libelle, publicId: [...trouves][0]! })
    else restants.push(libelle)
  }
  return { mapping, restants }
}

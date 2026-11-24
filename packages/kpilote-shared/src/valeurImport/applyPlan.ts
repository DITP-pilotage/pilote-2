import {
  type AxePlan,
  type CelluleSource,
  type OrigineRapprochement,
  type PlanTransformation,
  type Rapprochement,
  type TableauSource,
} from '../valeurImport'
import { parseDate } from './parseDate'
import { parseNombre } from './parseNombre'

// Application d'un plan de transformation à un tableau source : une fonction
// pure, rejouée dans le navigateur à chaque correction. Le même plan sur le même
// tableau donne toujours les mêmes lignes.

export type MotifCorrection =
  | { type: 'LIBELLE_AMBIGU'; candidats: string[] }
  | { type: 'LIBELLE_INCONNU' }
  | { type: 'CELLULE_VIDE' }
  | { type: 'DATE_ILLISIBLE' }
  | { type: 'VALEUR_NON_NUMERIQUE' }

// `LECTURE` : la valeur vient de la lecture de la cellule (date, nombre).
export type OrigineCellule = OrigineRapprochement | 'LECTURE'

export type Cellule<T> =
  | { statut: 'VALIDE'; brut: string; valeur: T; par: OrigineCellule }
  | { statut: 'A_CORRIGER'; brut: string; motif: MotifCorrection }

export type LigneImport = {
  // D'où vient la valeur dans le fichier : index dans `tableau.lignes` et colonne.
  source: { ligne: number; colonneValeur: string }
  individu: Cellule<string>
  // Une par axe de l'indicateur, dans l'ordre des axes.
  modalites: Cellule<string>[]
  date: Cellule<string>
  valeur: Cellule<number>
  // Index, dans le résultat, de la première ligne de même individu, modalités et date.
  doublonDe?: number
}

// Corrections saisies sur une date ou une valeur, par ligne d'import.
export type CorrectionsCellules = Record<string, { date?: string; valeur?: number }>

export const correctionKey = (source: LigneImport['source']): string =>
  `${source.ligne}:${source.colonneValeur}`

// Une ligne du fichier dépliée : même forme que les valeurs soient en lignes
// ou en colonnes.
type Observation = {
  ligne: number
  colonneValeur: string
  individu: string
  modalites: string[]
  date: { brut: string; lue: string | null }
  valeur: CelluleSource
}

const toTexte = (cellule: CelluleSource | undefined): string => {
  if (cellule === null || cellule === undefined) return ''
  return String(cellule).trim()
}

const buildColumnReader = (tableau: TableauSource) => {
  const indexByEntete = new Map(tableau.entetes.map((entete, index) => [entete, index]))
  return ({ ligne, colonne }: { ligne: number; colonne: string }): CelluleSource => {
    const index = indexByEntete.get(colonne)
    if (index === undefined) return null
    return tableau.lignes[ligne]?.[index] ?? null
  }
}

const isEmptyRow = (cellules: ReadonlyArray<CelluleSource>): boolean =>
  cellules.every((cellule) => toTexte(cellule) === '')

// Le libellé de la modalité d'un axe pour une cellule de valeur. Un axe lu en
// en-tête n'a de sens qu'avec `COLONNES_MODALITES` : ailleurs, son libellé est
// vide et la cellule est à corriger.
const readModalite = ({
  axe,
  read,
  ligne,
  enteteValeur,
}: {
  axe: AxePlan
  read: ReturnType<typeof buildColumnReader>
  ligne: number
  enteteValeur: string | null
}): string => {
  if (axe.lecture === 'CELLULE') return toTexte(read({ ligne, colonne: axe.colonne }))
  return enteteValeur ?? ''
}

const toObservations = ({
  plan,
  tableau,
}: {
  plan: PlanTransformation
  tableau: TableauSource
}): { observations: Observation[]; lignesEcartees: number } => {
  const read = buildColumnReader(tableau)
  const valeursRetenues = plan.filtre ? new Set(plan.filtre.valeursRetenues) : null
  const observations: Observation[] = []
  let lignesEcartees = 0

  for (const [ligne, cellules] of tableau.lignes.entries()) {
    if (isEmptyRow(cellules)) continue
    if (plan.filtre && valeursRetenues) {
      const type = toTexte(read({ ligne, colonne: plan.filtre.colonne }))
      if (!valeursRetenues.has(type)) {
        lignesEcartees += 1
        continue
      }
    }
    const individu = toTexte(read({ ligne, colonne: plan.individu.colonne }))
    const readModalites = (enteteValeur: string | null): string[] =>
      plan.axes.map((axe) => readModalite({ axe, read, ligne, enteteValeur }))

    switch (plan.valeurs.disposition) {
      case 'LIGNES': {
        const dateBrute = read({ ligne, colonne: plan.valeurs.colonneDate })
        observations.push({
          ligne,
          colonneValeur: plan.valeurs.colonneValeur,
          individu,
          modalites: readModalites(null),
          date: { brut: toTexte(dateBrute), lue: parseDate(dateBrute) },
          valeur: read({ ligne, colonne: plan.valeurs.colonneValeur }),
        })
        break
      }
      case 'COLONNES': {
        const modalites = readModalites(null)
        for (const { colonne, date } of plan.valeurs.colonnes) {
          const valeur = read({ ligne, colonne })
          // Un tableau à dates en colonnes a souvent des trous : pas de valeur, pas de ligne.
          if (toTexte(valeur) === '') continue
          observations.push({
            ligne,
            colonneValeur: colonne,
            individu,
            modalites,
            date: { brut: colonne, lue: date },
            valeur,
          })
        }
        break
      }
      case 'COLONNES_MODALITES': {
        const dateBrute = read({ ligne, colonne: plan.valeurs.colonneDate })
        const date = { brut: toTexte(dateBrute), lue: parseDate(dateBrute) }
        for (const colonne of plan.valeurs.colonnes) {
          const valeur = read({ ligne, colonne })
          // Comme pour les dates en colonnes : pas de valeur, pas de ligne.
          if (toTexte(valeur) === '') continue
          observations.push({
            ligne,
            colonneValeur: colonne,
            individu,
            modalites: readModalites(colonne),
            date,
            valeur,
          })
        }
        break
      }
    }
  }
  return { observations, lignesEcartees }
}

const toCelluleRapprochee = ({
  libelle,
  rapprochements,
}: {
  libelle: string
  rapprochements: Record<string, Rapprochement>
}): Cellule<string> => {
  if (libelle === '') return { statut: 'A_CORRIGER', brut: '', motif: { type: 'CELLULE_VIDE' } }
  const rapprochement = rapprochements[libelle]
  if (!rapprochement || rapprochement.statut === 'INCONNU') {
    return { statut: 'A_CORRIGER', brut: libelle, motif: { type: 'LIBELLE_INCONNU' } }
  }
  if (rapprochement.statut === 'AMBIGU') {
    return {
      statut: 'A_CORRIGER',
      brut: libelle,
      motif: { type: 'LIBELLE_AMBIGU', candidats: rapprochement.candidats },
    }
  }
  return {
    statut: 'VALIDE',
    brut: libelle,
    valeur: rapprochement.publicId,
    par: rapprochement.par,
  }
}

const toCelluleDate = ({
  date,
  correction,
}: {
  date: Observation['date']
  correction: string | undefined
}): Cellule<string> => {
  if (correction !== undefined) {
    return { statut: 'VALIDE', brut: date.brut, valeur: correction, par: 'UTILISATEUR' }
  }
  if (date.lue !== null) {
    return { statut: 'VALIDE', brut: date.brut, valeur: date.lue, par: 'LECTURE' }
  }
  const type = date.brut === '' ? 'CELLULE_VIDE' : 'DATE_ILLISIBLE'
  return { statut: 'A_CORRIGER', brut: date.brut, motif: { type } }
}

const toCelluleValeur = ({
  valeur,
  correction,
}: {
  valeur: CelluleSource
  correction: number | undefined
}): Cellule<number> => {
  const brut = toTexte(valeur)
  if (correction !== undefined) {
    return { statut: 'VALIDE', brut, valeur: correction, par: 'UTILISATEUR' }
  }
  const nombre = parseNombre(valeur)
  if (nombre !== null) return { statut: 'VALIDE', brut, valeur: nombre, par: 'LECTURE' }
  const type = brut === '' ? 'CELLULE_VIDE' : 'VALEUR_NON_NUMERIQUE'
  return { statut: 'A_CORRIGER', brut, motif: { type } }
}

const toLigneImport = ({
  observation,
  plan,
  corrections,
}: {
  observation: Observation
  plan: PlanTransformation
  corrections: CorrectionsCellules
}): LigneImport => {
  const source = { ligne: observation.ligne, colonneValeur: observation.colonneValeur }
  const correction = corrections[correctionKey(source)]
  return {
    source,
    individu: toCelluleRapprochee({
      libelle: observation.individu,
      rapprochements: plan.individu.rapprochements,
    }),
    modalites: plan.axes.map((axe, index) =>
      toCelluleRapprochee({
        libelle: observation.modalites[index] ?? '',
        rapprochements: axe.rapprochements,
      }),
    ),
    date: toCelluleDate({ date: observation.date, correction: correction?.date }),
    valeur: toCelluleValeur({ valeur: observation.valeur, correction: correction?.valeur }),
  }
}

const isComplete = (ligne: LigneImport): boolean =>
  [ligne.individu, ...ligne.modalites, ligne.date, ligne.valeur].every(
    (cellule) => cellule.statut === 'VALIDE',
  )

// Clé d'écriture d'une ligne complète : individu, modalités, date.
const writeKey = (ligne: LigneImport): string | null => {
  if (!isComplete(ligne)) return null
  const cellules = [ligne.individu, ...ligne.modalites, ligne.date]
  return cellules.map((cellule) => (cellule.statut === 'VALIDE' ? cellule.valeur : '')).join('|')
}

// Deux lignes complètes de même clé d'écriture : le batch les refuserait. La
// première reste importable, les suivantes pointent vers elle.
const markDoublons = (lignes: LigneImport[]): LigneImport[] => {
  const firstIndexByKey = new Map<string, number>()
  return lignes.map((ligne, index) => {
    const key = writeKey(ligne)
    if (key === null) return ligne
    const firstIndex = firstIndexByKey.get(key)
    if (firstIndex === undefined) {
      firstIndexByKey.set(key, index)
      return ligne
    }
    return { ...ligne, doublonDe: firstIndex }
  })
}

export type ResultatPlan = {
  lignes: LigneImport[]
  // Lignes du fichier écartées par le filtre du plan : ce ne sont pas des erreurs.
  lignesEcartees: number
}

export const applyPlan = ({
  plan,
  tableau,
  corrections = {},
}: {
  plan: PlanTransformation
  tableau: TableauSource
  corrections?: CorrectionsCellules
}): ResultatPlan => {
  const { observations, lignesEcartees } = toObservations({ plan, tableau })
  const lignes = observations.map((observation) =>
    toLigneImport({ observation, plan, corrections }),
  )
  return { lignes: markDoublons(lignes), lignesEcartees }
}

export const isImportable = (ligne: LigneImport): boolean =>
  isComplete(ligne) && ligne.doublonDe === undefined

export type ItemImport = { individu: string; modalites?: string[]; date: string; valeur: number }

// Les lignes importables, au format du batch d'écriture.
export const toItemsImport = (lignes: ReadonlyArray<LigneImport>): ItemImport[] =>
  lignes.flatMap((ligne) => {
    const { individu, date, valeur } = ligne
    const isReady =
      isImportable(ligne) &&
      individu.statut === 'VALIDE' &&
      date.statut === 'VALIDE' &&
      valeur.statut === 'VALIDE'
    if (!isReady) return []
    const modalites = ligne.modalites.flatMap((modalite) =>
      modalite.statut === 'VALIDE' ? [modalite.valeur] : [],
    )
    return [
      {
        individu: individu.valeur,
        ...(modalites.length > 0 ? { modalites } : {}),
        date: date.valeur,
        valeur: valeur.valeur,
      },
    ]
  })

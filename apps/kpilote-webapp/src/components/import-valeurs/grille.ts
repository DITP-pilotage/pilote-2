import { type CiblesSaisie, type PlanTransformation } from '@pilote/kpilote-shared/valeurImport'
import {
  type Cellule,
  isImportable,
  type LigneImport,
} from '@pilote/kpilote-shared/valeurImport/applyPlan'
import { type CibleRapprochement } from '@pilote/kpilote-shared/valeurImport/buildPlan'
import { partition } from 'es-toolkit'
import { Sparkles, TriangleAlert } from 'lucide-react'

import {
  type CelluleGrille,
  type CelluleMarker,
  type ColonneGrille,
  formatDate,
  formatValeur,
  type LigneGrille,
} from '@/lib/grilleValeurs'

// Dérivations pures de la grille d'import : colonnes, cellules affichées,
// compteurs, texte de provenance et ce qui se corrige. Les composants ne font qu'afficher.

export type Candidat = { id: string; nom: string }

const MARKER_A_CORRIGER: CelluleMarker = { icon: TriangleAlert, label: 'À corriger' }
const MARKER_ALBERT: CelluleMarker = { icon: Sparkles, label: 'Rapproché par l’assistant IA' }

// Une colonne par axe du plan, nommée par le nom de l'axe.
export const listColonnesGrille = ({
  plan,
  cibles,
}: {
  plan: PlanTransformation
  cibles: Pick<CiblesSaisie, 'axes'>
}): ColonneGrille[] => [
  { type: 'INDIVIDU', label: 'Individu' },
  ...plan.axes.map((planAxe, rang): ColonneGrille => {
    const axe = cibles.axes.find((candidate) => candidate.id === planAxe.axe)
    return { type: 'AXE', label: axe?.nom ?? planAxe.axe, axe: planAxe.axe, rang }
  }),
  { type: 'DATE', label: 'Date' },
  { type: 'VALEUR', label: 'Valeur' },
]

// Noms des individus et des modalités, par identifiant public.
export const buildNomById = (cibles: CiblesSaisie): Map<string, string> =>
  new Map(
    [...cibles.individus, ...cibles.axes.flatMap((axe) => axe.modalites)].map((candidat) => [
      candidat.id,
      candidat.nom,
    ]),
  )

const CELLULE_VIDE = '(vide)'

const CELLULE_A_CORRIGER = { tone: 'WARNING', marker: MARKER_A_CORRIGER } as const

// Ce que montre une cellule. Qu'elle soit éditable se décide à part, par `isEditableCellule`.
type CelluleAffichee = Omit<CelluleGrille, 'isEditable'>

const CELLULE_ABSENTE: CelluleAffichee = {
  text: '',
  identifiant: null,
  tone: 'DEFAULT',
  marker: null,
  alignRight: false,
}

const toCelluleEntite = ({
  cellule,
  nomById,
}: {
  cellule: Cellule<string>
  nomById: ReadonlyMap<string, string>
}): CelluleAffichee => {
  if (cellule.statut === 'A_CORRIGER') {
    return {
      text: cellule.brut === '' ? CELLULE_VIDE : cellule.brut,
      identifiant: null,
      ...CELLULE_A_CORRIGER,
      alignRight: false,
    }
  }
  return {
    text: nomById.get(cellule.valeur) ?? cellule.valeur,
    identifiant: cellule.valeur,
    tone: 'DEFAULT',
    marker: cellule.par === 'ALBERT' ? MARKER_ALBERT : null,
    alignRight: false,
  }
}

const toCelluleLue = <T>({
  cellule,
  format,
  isDoublon = false,
  alignRight,
}: {
  cellule: Cellule<T>
  format: (valeur: T) => string
  isDoublon?: boolean
  alignRight: boolean
}): CelluleAffichee => {
  if (cellule.statut === 'A_CORRIGER') {
    return {
      text: cellule.brut === '' ? CELLULE_VIDE : cellule.brut,
      identifiant: null,
      ...CELLULE_A_CORRIGER,
      alignRight,
    }
  }
  return {
    text: format(cellule.valeur),
    identifiant: null,
    ...(isDoublon ? CELLULE_A_CORRIGER : { tone: 'DEFAULT', marker: null }),
    alignRight,
  }
}

// Un doublon se signale sur sa date : c'est elle qu'on corrige pour le lever.
const toCelluleAffichee = ({
  ligne,
  colonne,
  nomById,
}: {
  ligne: LigneImport
  colonne: ColonneGrille
  nomById: ReadonlyMap<string, string>
}): CelluleAffichee => {
  switch (colonne.type) {
    case 'INDIVIDU':
      return toCelluleEntite({ cellule: ligne.individu, nomById })
    case 'AXE': {
      const cellule = ligne.modalites[colonne.rang]
      return cellule ? toCelluleEntite({ cellule, nomById }) : CELLULE_ABSENTE
    }
    case 'DATE':
      return toCelluleLue({
        cellule: ligne.date,
        format: formatDate,
        isDoublon: ligne.doublonDe !== undefined,
        alignRight: false,
      })
    case 'VALEUR':
      return toCelluleLue({ cellule: ligne.valeur, format: formatValeur, alignRight: true })
  }
}

// Ce qui se corrige dans la grille : un libellé à rapprocher, une date, une valeur. Un libellé
// vide n'a rien à rapprocher : il se complète dans le fichier.
export const isEditableCellule = ({
  ligne,
  colonne,
}: {
  ligne: LigneImport
  colonne: ColonneGrille
}): boolean => {
  switch (colonne.type) {
    case 'INDIVIDU':
      return ligne.individu.brut !== ''
    case 'AXE': {
      const brut = ligne.modalites[colonne.rang]?.brut ?? ''
      return brut !== ''
    }
    case 'DATE':
    case 'VALEUR':
      return true
  }
}

// Une cellule par colonne de `listColonnesGrille`.
export const buildLignesGrille = ({
  lignes,
  colonnes,
  nomById,
}: {
  lignes: ReadonlyArray<LigneImport>
  colonnes: ReadonlyArray<ColonneGrille>
  nomById: ReadonlyMap<string, string>
}): LigneGrille[] =>
  lignes.map((ligne, index) => ({
    index,
    numero: index + 1,
    cellules: colonnes.map((colonne) => ({
      ...toCelluleAffichee({ ligne, colonne, nomById }),
      isEditable: isEditableCellule({ ligne, colonne }),
    })),
  }))

export const summarizeLignes = (
  lignes: ReadonlyArray<LigneImport>,
): { pretes: number; aCorriger: number } => {
  const [pretes, aCorriger] = partition([...lignes], isImportable)
  return { pretes: pretes.length, aCorriger: aCorriger.length }
}

export type FiltreGrille = 'TOUTES' | 'A_CORRIGER'

// `lignesGrille` porte, par son `index`, la position de chaque ligne dans `lignes`.
export const filterLignes = ({
  lignesGrille,
  lignes,
  filtre,
}: {
  lignesGrille: ReadonlyArray<LigneGrille>
  lignes: ReadonlyArray<LigneImport>
  filtre: FiltreGrille
}): LigneGrille[] => {
  if (filtre === 'TOUTES') return [...lignesGrille]
  return lignesGrille.filter((ligneGrille) => {
    const ligne = lignes[ligneGrille.index]
    return ligne !== undefined && !isImportable(ligne)
  })
}

// Ce que l'utilisateur peut corriger dans une cellule, ou `null` si la
// correction passe par le fichier (libellé vide : rien à rapprocher).
export type EditionCellule =
  | {
      type: 'RAPPROCHEMENT'
      cible: CibleRapprochement
      libelle: string
      selected: string | null
      candidats: Candidat[]
      action: string
    }
  | { type: 'DATE'; value: string; action: string }
  | { type: 'VALEUR'; value: number | null; action: string }

// Les candidats d'un libellé ambigu d'abord, puis les autres dans leur ordre.
const sortCandidats = ({
  candidats,
  preferes,
}: {
  candidats: ReadonlyArray<Candidat>
  preferes: ReadonlyArray<string>
}): Candidat[] => {
  const [first, rest] = partition([...candidats], (candidat) => preferes.includes(candidat.id))
  return [...first, ...rest]
}

const describeRapprochementEdition = ({
  cellule,
  cible,
  candidats,
  action,
}: {
  cellule: Cellule<string>
  cible: CibleRapprochement
  candidats: ReadonlyArray<Candidat>
  action: string
}): EditionCellule => {
  if (cellule.statut === 'VALIDE') {
    return {
      type: 'RAPPROCHEMENT',
      cible,
      libelle: cellule.brut,
      selected: cellule.valeur,
      candidats: [...candidats],
      action: 'Changer',
    }
  }
  const preferes = cellule.motif.type === 'LIBELLE_AMBIGU' ? cellule.motif.candidats : []
  return {
    type: 'RAPPROCHEMENT',
    cible,
    libelle: cellule.brut,
    selected: null,
    candidats: sortCandidats({ candidats, preferes }),
    action,
  }
}

export const describeEdition = ({
  ligne,
  colonne,
  cibles,
}: {
  ligne: LigneImport
  colonne: ColonneGrille
  cibles: CiblesSaisie
}): EditionCellule | null => {
  if (!isEditableCellule({ ligne, colonne })) return null
  switch (colonne.type) {
    case 'INDIVIDU':
      return describeRapprochementEdition({
        cellule: ligne.individu,
        cible: { type: 'INDIVIDU' },
        candidats: cibles.individus,
        action: 'Choisir un individu',
      })
    case 'AXE': {
      const cellule = ligne.modalites[colonne.rang]
      if (!cellule) return null
      return describeRapprochementEdition({
        cellule,
        cible: { type: 'AXE', axe: colonne.axe },
        candidats: cibles.axes.find((axe) => axe.id === colonne.axe)?.modalites ?? [],
        action: 'Choisir une modalité',
      })
    }
    case 'DATE':
      return ligne.date.statut === 'VALIDE'
        ? { type: 'DATE', value: ligne.date.valeur, action: 'Modifier' }
        : { type: 'DATE', value: '', action: 'Saisir une date' }
    case 'VALEUR':
      return ligne.valeur.statut === 'VALIDE'
        ? { type: 'VALEUR', value: ligne.valeur.valeur, action: 'Modifier' }
        : { type: 'VALEUR', value: null, action: 'Saisir une valeur' }
  }
}

// Numéro de la ligne dans le fichier : la première ligne porte les en-têtes.
const fileLineOf = (ligne: LigneImport): number => ligne.source.ligne + 2

const describeOrigine = ({
  ligne,
  colonneFichier,
  brut,
}: {
  ligne: LigneImport
  colonneFichier: string
  brut: string
}): string => {
  const position = `Fichier, ligne ${fileLineOf(ligne)}, colonne « ${colonneFichier} »`
  return brut === '' ? `${position} : cellule vide.` : `${position} : « ${brut} ».`
}

const describeEntite = ({
  cellule,
  nomById,
  inconnu,
}: {
  cellule: Cellule<string>
  nomById: ReadonlyMap<string, string>
  inconnu: string
}): string => {
  const nommer = (publicId: string): string => {
    const nom = nomById.get(publicId)
    return nom === undefined ? publicId : `${nom} (${publicId})`
  }
  if (cellule.statut === 'VALIDE') {
    switch (cellule.par) {
      case 'ALBERT':
        return `Rapproché par l’assistant IA de ${nommer(cellule.valeur)}.`
      case 'UTILISATEUR':
        return `Vous avez choisi ${nommer(cellule.valeur)}.`
      default:
        return `Correspondance exacte avec ${nommer(cellule.valeur)}.`
    }
  }
  switch (cellule.motif.type) {
    case 'LIBELLE_AMBIGU':
      return `Plusieurs correspondances possibles : ${cellule.motif.candidats.map(nommer).join(', ')}.`
    case 'CELLULE_VIDE':
      return 'Complétez le fichier, puis déposez-le à nouveau.'
    default:
      return inconnu
  }
}

const describeDate = (ligne: LigneImport): string => {
  const { date } = ligne
  if (date.statut === 'A_CORRIGER') {
    return date.motif.type === 'CELLULE_VIDE'
      ? 'Saisissez la date.'
      : 'Cette date n’est pas reconnue.'
  }
  const lecture =
    date.par === 'UTILISATEUR'
      ? `Vous avez saisi le ${formatDate(date.valeur)}.`
      : `Lu comme le ${formatDate(date.valeur)}.`
  if (ligne.doublonDe === undefined) return lecture
  return `${lecture} Doublon de la ligne ${ligne.doublonDe + 1} : même individu et même date.`
}

const describeValeur = (ligne: LigneImport): string => {
  const { valeur } = ligne
  if (valeur.statut === 'VALIDE') {
    return valeur.par === 'UTILISATEUR' ? `Vous avez saisi ${formatValeur(valeur.valeur)}.` : ''
  }
  return valeur.motif.type === 'CELLULE_VIDE' ? 'Saisissez la valeur.' : 'Ce n’est pas un nombre.'
}

// D'où vient la cellule sélectionnée, et comment elle a été lue ou rapprochée.
export const describeProvenance = ({
  ligne,
  numero,
  colonne,
  plan,
  nomById,
}: {
  ligne: LigneImport
  numero: number
  colonne: ColonneGrille
  plan: PlanTransformation
  nomById: ReadonlyMap<string, string>
}): { reference: string; texte: string } => {
  const reference = `${colonne.label} · ligne ${numero}`
  const join = (...parts: string[]): string => parts.filter((part) => part !== '').join(' ')

  switch (colonne.type) {
    case 'INDIVIDU':
      return {
        reference,
        texte: join(
          describeOrigine({
            ligne,
            colonneFichier: plan.individu.colonne,
            brut: ligne.individu.brut,
          }),
          describeEntite({
            cellule: ligne.individu,
            nomById,
            inconnu: 'Aucun individu ne correspond.',
          }),
        ),
      }
    case 'AXE': {
      const cellule = ligne.modalites[colonne.rang]
      const colonneFichier = plan.axes[colonne.rang]?.colonne ?? colonne.label
      if (!cellule) return { reference, texte: '' }
      return {
        reference,
        texte: join(
          describeOrigine({ ligne, colonneFichier, brut: cellule.brut }),
          describeEntite({
            cellule,
            nomById,
            inconnu: `Aucune modalité de l’axe « ${colonne.label} » ne correspond.`,
          }),
        ),
      }
    }
    case 'DATE': {
      const origine =
        plan.valeurs.disposition === 'LIGNES'
          ? describeOrigine({
              ligne,
              colonneFichier: plan.valeurs.colonneDate,
              brut: ligne.date.brut,
            })
          : `Fichier, en-tête de colonne « ${ligne.source.colonneValeur} ».`
      return { reference, texte: join(origine, describeDate(ligne)) }
    }
    case 'VALEUR':
      return {
        reference,
        texte: join(
          describeOrigine({
            ligne,
            colonneFichier: ligne.source.colonneValeur,
            brut: ligne.valeur.brut,
          }),
          describeValeur(ligne),
        ),
      }
  }
}

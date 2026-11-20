import {
  type CiblesSaisieApiModel,
  type PlanTransformation,
} from '@pilote/kpilote-shared/valeurImport'
import {
  type Cellule,
  isImportable,
  type LigneImport,
} from '@pilote/kpilote-shared/valeurImport/applyPlan'
import { type CibleRapprochement } from '@pilote/kpilote-shared/valeurImport/buildPlan'
import { partition } from 'es-toolkit'

// Dérivations pures de la grille d'import : colonnes, cellules affichées,
// compteurs et texte de provenance. Les composants ne font qu'afficher.

export type ColonneGrille =
  | { type: 'INDIVIDU'; label: string }
  | { type: 'AXE'; label: string; axe: string; rang: number }
  | { type: 'DATE'; label: string }
  | { type: 'VALEUR'; label: string }

export type Candidat = { id: string; nom: string }

export type PositionCellule = { ligne: number; colonne: number }

// Une colonne par axe du plan, nommée par le nom de l'axe.
export const listColonnesGrille = ({
  plan,
  cibles,
}: {
  plan: PlanTransformation
  cibles: Pick<CiblesSaisieApiModel, 'axes'>
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
export const buildNomById = (cibles: CiblesSaisieApiModel): Map<string, string> =>
  new Map(
    [...cibles.individus, ...cibles.axes.flatMap((axe) => axe.modalites)].map((candidat) => [
      candidat.id,
      candidat.nom,
    ]),
  )

export const formatDate = (iso: string): string => {
  const [annee = '', mois = '', jour = ''] = iso.split('-')
  return `${jour}/${mois}/${annee}`
}

const NOMBRE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 })

export const formatValeur = (valeur: number): string => NOMBRE.format(valeur)

export type CelluleGrille = {
  text: string
  // Identifiant public d'un individu ou d'une modalité reconnus.
  identifiant: string | null
  isAlbert: boolean
  isWarning: boolean
  alignRight: boolean
}

const CELLULE_VIDE = '(vide)'

const toCelluleEntite = ({
  cellule,
  nomById,
}: {
  cellule: Cellule<string>
  nomById: ReadonlyMap<string, string>
}): CelluleGrille => {
  if (cellule.statut === 'A_CORRIGER') {
    return {
      text: cellule.brut === '' ? CELLULE_VIDE : cellule.brut,
      identifiant: null,
      isAlbert: false,
      isWarning: true,
      alignRight: false,
    }
  }
  return {
    text: nomById.get(cellule.valeur) ?? cellule.valeur,
    identifiant: cellule.valeur,
    isAlbert: cellule.par === 'ALBERT',
    isWarning: false,
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
}): CelluleGrille => {
  const isValide = cellule.statut === 'VALIDE'
  const brut = cellule.brut === '' ? CELLULE_VIDE : cellule.brut
  return {
    text: isValide ? format(cellule.valeur) : brut,
    identifiant: null,
    isAlbert: false,
    isWarning: !isValide || isDoublon,
    alignRight,
  }
}

export type LigneGrille = {
  // Index de la ligne dans le résultat de `applyPlan`.
  index: number
  numero: number
  cellules: CelluleGrille[]
  isImportable: boolean
}

// Les cellules d'une ligne, dans l'ordre des colonnes de `listColonnesGrille`.
// Un doublon se signale sur sa date : c'est elle qu'on corrige pour le lever.
export const buildLignesGrille = ({
  lignes,
  nomById,
}: {
  lignes: ReadonlyArray<LigneImport>
  nomById: ReadonlyMap<string, string>
}): LigneGrille[] =>
  lignes.map((ligne, index) => ({
    index,
    numero: index + 1,
    isImportable: isImportable(ligne),
    cellules: [
      toCelluleEntite({ cellule: ligne.individu, nomById }),
      ...ligne.modalites.map((modalite) => toCelluleEntite({ cellule: modalite, nomById })),
      toCelluleLue({
        cellule: ligne.date,
        format: formatDate,
        isDoublon: ligne.doublonDe !== undefined,
        alignRight: false,
      }),
      toCelluleLue({ cellule: ligne.valeur, format: formatValeur, alignRight: true }),
    ],
  }))

export const summarizeLignes = (
  lignes: ReadonlyArray<LigneGrille>,
): { pretes: number; aCorriger: number } => {
  const [pretes, aCorriger] = partition([...lignes], (ligne) => ligne.isImportable)
  return { pretes: pretes.length, aCorriger: aCorriger.length }
}

export type FiltreGrille = 'TOUTES' | 'A_CORRIGER'

export const filterLignes = ({
  lignes,
  filtre,
}: {
  lignes: ReadonlyArray<LigneGrille>
  filtre: FiltreGrille
}): LigneGrille[] =>
  filtre === 'TOUTES' ? [...lignes] : lignes.filter((ligne) => !ligne.isImportable)

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
}): EditionCellule | null => {
  if (cellule.brut === '') return null
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
  cibles: CiblesSaisieApiModel
}): EditionCellule | null => {
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
    case 'DATE': {
      const isValide = ligne.date.statut === 'VALIDE'
      return {
        type: 'DATE',
        value: ligne.date.statut === 'VALIDE' ? ligne.date.valeur : '',
        action: isValide ? 'Modifier' : 'Saisir une date',
      }
    }
    case 'VALEUR': {
      const isValide = ligne.valeur.statut === 'VALIDE'
      return {
        type: 'VALEUR',
        value: ligne.valeur.statut === 'VALIDE' ? ligne.valeur.valeur : null,
        action: isValide ? 'Modifier' : 'Saisir une valeur',
      }
    }
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

// Déplacement de la sélection au clavier, borné aux lignes affichées.
export const movePosition = ({
  position,
  delta,
  lignes,
  nombreColonnes,
}: {
  position: PositionCellule
  delta: { ligne: number; colonne: number }
  lignes: ReadonlyArray<LigneGrille>
  nombreColonnes: number
}): PositionCellule => {
  if (lignes.length === 0) return position
  const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max)
  const rang = lignes.findIndex((ligne) => ligne.index === position.ligne)
  const nextRang = clamp(Math.max(rang, 0) + delta.ligne, lignes.length - 1)
  return {
    ligne: lignes[nextRang]?.index ?? position.ligne,
    colonne: clamp(position.colonne + delta.colonne, nombreColonnes - 1),
  }
}

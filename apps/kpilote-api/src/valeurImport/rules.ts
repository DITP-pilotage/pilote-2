import { isValidCalendarDate } from '@pilote/kpilote-shared/dates'
import {
  type DispositionValeurs,
  type FiltreLignes,
  type Rapprochement,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'
import { listLibelles } from '@pilote/kpilote-shared/valeurImport/buildPlan'
import { parseDate } from '@pilote/kpilote-shared/valeurImport/parseDate'
import { countBy } from 'es-toolkit'
import { err, ok, type Result } from 'neverthrow'

// Règles de validation des propositions d'Albert. Chaque règle renvoie toutes
// les erreurs trouvées : elles repartent telles quelles vers Albert, qui corrige
// en un seul essai.

// Ce qu'Albert remet par le tool `decrire_structure` : un schéma plat, où les
// champs propres à une disposition sont optionnels.
export type StructureProposee = {
  colonneIndividu: string
  colonnesAxes: Array<{ axe: string; colonne: string }>
  disposition: 'LIGNES' | 'COLONNES'
  colonneDate?: string | null | undefined
  colonneValeur?: string | null | undefined
  colonnesDates?: Array<{ colonne: string; date?: string | null | undefined }> | null | undefined
  colonneFiltre?: string | null | undefined
  valeursFiltre?: string[] | null | undefined
}

export type StructureValidee = {
  colonneIndividu: string
  colonnesAxes: Array<{ axe: string; colonne: string }>
  valeurs: DispositionValeurs
  filtre?: FiltreLignes
}

export type ErreurStructure =
  | { type: 'COLONNE_INCONNUE'; colonne: string }
  | { type: 'COLONNE_A_DEUX_ROLES'; colonne: string }
  | { type: 'AXE_INCONNU'; axe: string }
  | { type: 'AXE_EN_DOUBLE'; axe: string }
  | { type: 'CHAMP_MANQUANT'; champ: 'colonneDate' | 'colonneValeur' | 'colonnesDates' }
  | { type: 'DATE_INVALIDE'; colonne: string }
  | { type: 'FILTRE_SANS_VALEUR'; colonne: string }
  | { type: 'VALEUR_DE_FILTRE_INCONNUE'; valeur: string }

export type StructureInvalideError = { type: 'STRUCTURE_INVALIDE'; erreurs: ErreurStructure[] }

const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const duplicatesOf = (values: ReadonlyArray<string>): string[] =>
  Object.entries(countBy(values, (value) => value))
    .filter(([, count]) => count > 1)
    .map(([value]) => value)

type Disposition = { valeurs: DispositionValeurs | null; erreurs: ErreurStructure[] }

const readDisposition = (proposition: StructureProposee): Disposition => {
  if (proposition.disposition === 'LIGNES') {
    const colonneDate = clean(proposition.colonneDate)
    const colonneValeur = clean(proposition.colonneValeur)
    const erreurs: ErreurStructure[] = []
    if (!colonneDate) erreurs.push({ type: 'CHAMP_MANQUANT', champ: 'colonneDate' })
    if (!colonneValeur) erreurs.push({ type: 'CHAMP_MANQUANT', champ: 'colonneValeur' })
    if (!colonneDate || !colonneValeur) return { valeurs: null, erreurs }
    return { valeurs: { disposition: 'LIGNES', colonneDate, colonneValeur }, erreurs }
  }
  const proposees = proposition.colonnesDates ?? []
  if (proposees.length === 0) {
    return { valeurs: null, erreurs: [{ type: 'CHAMP_MANQUANT', champ: 'colonnesDates' }] }
  }
  // Le parseur du code fait autorité sur un en-tête qu'il sait lire ; la date
  // donnée par Albert ne sert que pour les en-têtes qu'il ne tranche pas.
  const colonnes = proposees.map(({ colonne, date }) => ({
    colonne: colonne.trim(),
    date: parseDate(colonne) ?? clean(date) ?? '',
  }))
  const erreurs = colonnes
    .filter(({ date }) => !isValidCalendarDate(date))
    .map(({ colonne }): ErreurStructure => ({ type: 'DATE_INVALIDE', colonne }))
  return { valeurs: { disposition: 'COLONNES', colonnes }, erreurs }
}

const columnsOf = (valeurs: DispositionValeurs): string[] => {
  switch (valeurs.disposition) {
    case 'LIGNES':
      return [valeurs.colonneDate, valeurs.colonneValeur]
    case 'COLONNES':
      return valeurs.colonnes.map(({ colonne }) => colonne)
    case 'COLONNES_MODALITES':
      return [valeurs.colonneDate, ...valeurs.colonnes]
  }
}

type Filtre = { filtre: FiltreLignes | null; erreurs: ErreurStructure[] }

const readFiltre = ({
  proposition,
  tableau,
}: {
  proposition: StructureProposee
  tableau: TableauSource
}): Filtre => {
  const colonne = clean(proposition.colonneFiltre)
  if (!colonne) return { filtre: null, erreurs: [] }
  const valeursRetenues = proposition.valeursFiltre ?? []
  // Un filtre sans valeur écarterait toutes les lignes du fichier.
  if (valeursRetenues.length === 0) {
    return { filtre: null, erreurs: [{ type: 'FILTRE_SANS_VALEUR', colonne }] }
  }
  const valeursConnues = new Set(listLibelles({ tableau, colonne }))
  const erreurs = valeursRetenues
    .filter((valeur) => !valeursConnues.has(valeur))
    .map((valeur): ErreurStructure => ({ type: 'VALEUR_DE_FILTRE_INCONNUE', valeur }))
  return { filtre: { colonne, valeursRetenues }, erreurs }
}

// Une structure n'est acceptée que si chaque colonne citée existe dans le
// fichier et n'a qu'un rôle, et si chaque axe cité est un axe de l'indicateur,
// cité une seule fois.
export const checkStructure = ({
  proposition,
  tableau,
  axes,
}: {
  proposition: StructureProposee
  tableau: TableauSource
  axes: ReadonlyArray<string>
}): Result<StructureValidee, StructureInvalideError> => {
  const colonneIndividu = proposition.colonneIndividu.trim()
  const colonnesAxes = proposition.colonnesAxes.map(({ axe, colonne }) => ({
    axe,
    colonne: colonne.trim(),
  }))
  const disposition = readDisposition(proposition)
  const filtre = readFiltre({ proposition, tableau })

  const roles = [
    colonneIndividu,
    ...colonnesAxes.map(({ colonne }) => colonne),
    ...(disposition.valeurs ? columnsOf(disposition.valeurs) : []),
    ...(filtre.filtre ? [filtre.filtre.colonne] : []),
  ]
  const entetes = new Set(tableau.entetes)
  const axesConnus = new Set(axes)
  const axesCites = colonnesAxes.map(({ axe }) => axe)

  const erreurs: ErreurStructure[] = [
    ...[...new Set(roles)]
      .filter((colonne) => !entetes.has(colonne))
      .map((colonne): ErreurStructure => ({ type: 'COLONNE_INCONNUE', colonne })),
    ...duplicatesOf(roles).map((colonne): ErreurStructure => ({
      type: 'COLONNE_A_DEUX_ROLES',
      colonne,
    })),
    ...[...new Set(axesCites)]
      .filter((axe) => !axesConnus.has(axe))
      .map((axe): ErreurStructure => ({ type: 'AXE_INCONNU', axe })),
    ...duplicatesOf(axesCites).map((axe): ErreurStructure => ({ type: 'AXE_EN_DOUBLE', axe })),
    ...disposition.erreurs,
    ...filtre.erreurs,
  ]
  if (erreurs.length > 0 || !disposition.valeurs)
    return err({ type: 'STRUCTURE_INVALIDE', erreurs })

  return ok({
    colonneIndividu,
    colonnesAxes,
    valeurs: disposition.valeurs,
    ...(filtre.filtre ? { filtre: filtre.filtre } : {}),
  })
}

export type AxeSansColonneError = { type: 'AXE_SANS_COLONNE'; axes: string[] }

// Une valeur se saisit avec une modalité pour chaque axe de l'indicateur : sans
// colonne pour l'un d'eux, aucune ligne du fichier ne serait importable.
export const checkAxesCouverts = ({
  colonnesAxes,
  axes,
}: {
  colonnesAxes: ReadonlyArray<{ axe: string }>
  axes: ReadonlyArray<string>
}): Result<void, AxeSansColonneError> => {
  const couverts = new Set(colonnesAxes.map(({ axe }) => axe))
  const manquants = axes.filter((axe) => !couverts.has(axe))
  if (manquants.length > 0) return err({ type: 'AXE_SANS_COLONNE', axes: manquants })
  return ok()
}

// Ce qu'Albert remet par le tool `rapprocher_libelles`, pour un libellé.
export type RapprochementPropose = {
  libelle: string
  statut: 'RESOLU' | 'AMBIGU' | 'INCONNU'
  publicId?: string | null | undefined
  candidats?: string[] | null | undefined
}

export type ErreurRapprochement =
  | { type: 'LIBELLE_MANQUANT'; libelle: string }
  | { type: 'LIBELLE_EN_DOUBLE'; libelle: string }
  | { type: 'LIBELLE_INVENTE'; libelle: string }
  | { type: 'PUBLIC_ID_MANQUANT'; libelle: string }
  | { type: 'PUBLIC_ID_INCONNU'; libelle: string; publicId: string }

export type RapprochementsInvalidesError = {
  type: 'RAPPROCHEMENTS_INVALIDES'
  erreurs: ErreurRapprochement[]
}

type Verdict = { rapprochement: Rapprochement | null; erreurs: ErreurRapprochement[] }

const readRapprochement = ({
  propose,
  publicIdsConnus,
}: {
  propose: RapprochementPropose
  publicIdsConnus: ReadonlySet<string>
}): Verdict => {
  const { libelle } = propose
  if (propose.statut === 'INCONNU') return { rapprochement: { statut: 'INCONNU' }, erreurs: [] }

  const cites = propose.statut === 'RESOLU' ? [propose.publicId ?? ''] : (propose.candidats ?? [])
  const publicIds = cites.map((publicId) => publicId.trim()).filter((publicId) => publicId !== '')
  if (publicIds.length === 0) {
    return { rapprochement: null, erreurs: [{ type: 'PUBLIC_ID_MANQUANT', libelle }] }
  }
  const erreurs = publicIds
    .filter((publicId) => !publicIdsConnus.has(publicId))
    .map((publicId): ErreurRapprochement => ({ type: 'PUBLIC_ID_INCONNU', libelle, publicId }))
  if (erreurs.length > 0) return { rapprochement: null, erreurs }

  if (propose.statut === 'RESOLU') {
    return {
      rapprochement: { statut: 'RESOLU', publicId: publicIds[0]!, par: 'ALBERT' },
      erreurs: [],
    }
  }
  return { rapprochement: { statut: 'AMBIGU', candidats: publicIds }, erreurs: [] }
}

// Chaque libellé demandé reçoit exactement un rapprochement, et tout identifiant
// cité fait partie des candidats fournis : Albert n'invente ni libellé ni cible.
export const checkRapprochements = ({
  proposition,
  libelles,
  publicIdsConnus,
}: {
  proposition: ReadonlyArray<RapprochementPropose>
  libelles: ReadonlyArray<string>
  publicIdsConnus: ReadonlySet<string>
}): Result<Record<string, Rapprochement>, RapprochementsInvalidesError> => {
  const attendus = new Set(libelles)
  const cites = proposition.map(({ libelle }) => libelle)
  const citesSet = new Set(cites)

  const rapprochements: Record<string, Rapprochement> = {}
  const erreurs: ErreurRapprochement[] = [
    ...libelles
      .filter((libelle) => !citesSet.has(libelle))
      .map((libelle): ErreurRapprochement => ({ type: 'LIBELLE_MANQUANT', libelle })),
    ...duplicatesOf(cites).map((libelle): ErreurRapprochement => ({
      type: 'LIBELLE_EN_DOUBLE',
      libelle,
    })),
    ...[...citesSet]
      .filter((libelle) => !attendus.has(libelle))
      .map((libelle): ErreurRapprochement => ({ type: 'LIBELLE_INVENTE', libelle })),
  ]
  for (const propose of proposition) {
    const verdict = readRapprochement({ propose, publicIdsConnus })
    erreurs.push(...verdict.erreurs)
    if (verdict.rapprochement) rapprochements[propose.libelle] = verdict.rapprochement
  }

  if (erreurs.length > 0) return err({ type: 'RAPPROCHEMENTS_INVALIDES', erreurs })
  return ok(rapprochements)
}

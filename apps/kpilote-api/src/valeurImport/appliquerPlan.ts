import { formatCelluleId } from '@pilote/kpilote-shared/cellule'

import { type Plan, type PlanLong, type PlanPivot } from '@/valeurImport/calls/decouvrirStructure'
import { type ResolutionResult } from '@/valeurImport/calls/resoudreIndividus'
import { safeStringify } from '@/valeurImport/helpers/safeStringify'
import { parseFrLibre } from '@/valeurImport/parsers/parseFrLibre'
import { parseNombre } from '@/valeurImport/parsers/parseNombre'

// `coordonnees` n'est présent qu'à partir de deux colonnes d'identité ; `individu`
// est alors la cellule canonique (membres dans l'ordre des dimensions, joints par `~`).
export type ItemNormalise = {
  individu: string
  coordonnees?: string[]
  date: string
  valeur: number
}

export type WarningApplication = {
  code:
    | 'INDIVIDU_NON_RESOLU'
    | 'INDIVIDU_HALLUCINE'
    | 'DATE_INVALIDE'
    | 'VALEUR_INVALIDE'
    | 'CELLULE_VIDE'
    | 'LIGNE_IGNOREE'
    | 'LIGNE_PARTIELLE'
    | 'DIMENSIONS_NON_COUVERTES'
    | 'COLONNE_IDENTITE_IGNOREE'
  message: string
  ligneSource?: number
  libelleSource?: string
  colonneSource?: string
}

export type ResultatApplication = {
  items: ItemNormalise[]
  warnings: WarningApplication[]
}

// Factory par warning : construit l'objet WarningApplication (message + champs source).

const warnAucuneValeurAvancement = (colonne: string): WarningApplication => ({
  code: 'LIGNE_IGNOREE',
  message:
    `Aucune valeur d'avancement n'a pu être identifiée dans la colonne « ${colonne} ». ` +
    `Aucune valeur n'a été importée.`,
  colonneSource: colonne,
})

const warnLigneIgnoreeType = ({
  index,
  colonne,
  valeur,
}: {
  index: number
  colonne: string
  valeur: string
}): WarningApplication => ({
  code: 'LIGNE_IGNOREE',
  message:
    `Ligne ${index} : valeur « ${valeur} » écartée ` +
    `(colonne « ${colonne} ») — seules les valeurs d'avancement sont importées.`,
  ligneSource: index,
  colonneSource: colonne,
})

const warnIndividuHallucine = ({
  publicId,
  libelle,
}: {
  publicId: string
  libelle: string
}): WarningApplication => ({
  code: 'INDIVIDU_HALLUCINE',
  message: `Albert a proposé un publicId inconnu (${publicId}) pour « ${libelle} » — ignoré.`,
  libelleSource: libelle,
})

const warnIndividuNonResolu = ({
  libelle,
  ligne,
  raison,
  colonne,
}: {
  libelle: string
  ligne: number
  raison: string
  // Multi-dimension uniquement : la correspondance est indexée par colonne.
  colonne?: string | undefined
}): WarningApplication => ({
  code: 'INDIVIDU_NON_RESOLU',
  message:
    colonne === undefined
      ? `« ${libelle} » : ${raison}`
      : `« ${libelle} » (colonne « ${colonne} ») : ${raison}`,
  libelleSource: libelle,
  ligneSource: ligne,
  ...(colonne === undefined ? {} : { colonneSource: colonne }),
})

const warnLignePartielle = ({
  index,
  colonnesManquantes,
  libelle,
}: {
  index: number
  colonnesManquantes: ReadonlyArray<string>
  libelle: string
}): WarningApplication => ({
  code: 'LIGNE_PARTIELLE',
  message:
    `Ligne ${index} : identité incomplète (colonne${colonnesManquantes.length > 1 ? 's' : ''} ` +
    `${colonnesManquantes.map((colonne) => `« ${colonne} »`).join(', ')} non reconnue` +
    `${colonnesManquantes.length > 1 ? 's' : ''}) — ligne écartée.`,
  ligneSource: index,
  ...(colonnesManquantes[0] === undefined ? {} : { colonneSource: colonnesManquantes[0] }),
  libelleSource: libelle,
})

const warnCelluleVide = ({
  index,
  colonne,
}: {
  index: number
  colonne: string
}): WarningApplication => ({
  code: 'CELLULE_VIDE',
  message: `Ligne ${index} : libellé individu vide (colonne « ${colonne} »).`,
  ligneSource: index,
  colonneSource: colonne,
})

const warnDateInvalide = ({
  index,
  colonne,
  libelle,
  brut,
}: {
  index: number
  colonne: string
  libelle: string
  brut: string
}): WarningApplication => ({
  code: 'DATE_INVALIDE',
  message: `Ligne ${index} : « ${brut} » n'a pas pu être interprété comme une date.`,
  ligneSource: index,
  colonneSource: colonne,
  libelleSource: libelle,
})

const warnValeurInvalide = ({
  index,
  colonne,
  libelle,
  raison,
  mentionColonne,
}: {
  index: number
  colonne: string
  libelle: string
  raison: string
  mentionColonne: boolean
}): WarningApplication => ({
  code: 'VALEUR_INVALIDE',
  message: mentionColonne
    ? `Ligne ${index}, colonne « ${colonne} » : ${raison}`
    : `Ligne ${index} : ${raison}`,
  ligneSource: index,
  colonneSource: colonne,
  libelleSource: libelle,
})

// Aucune valeur d'avancement identifiée : on écarte tout, un seul warning global.
const resultatAucuneValeurAvancement = (colonne: string): ResultatApplication => ({
  items: [],
  warnings: [warnAucuneValeurAvancement(colonne)],
})

const normaliserType = (valeur: unknown): string => safeStringify(valeur).trim().toLowerCase()

// Identité d'une ligne : la cible (individu, et coordonnées en multi) et le libellé
// source repris dans les warnings. `null` = ligne écartée (warning déjà émis).
type IdentiteLigne = { individu: string; coordonnees?: string[]; libelle: string }
type IdentifierLigne = (row: Record<string, unknown>, index: number) => IdentiteLigne | null

// Index (libellé → publicId) d'une résolution, en filtrant les éventuels publicId
// hallucinés (sécurité défensive — le tool refine devrait déjà l'avoir bloqué).
// Chaque libellé non résolu n'est signalé qu'une fois (pas une fois par ligne,
// sinon ça pollue inutilement).
const indexerResolution = ({
  resolution,
  individusValides,
  colonne,
  warnings,
}: {
  resolution: ResolutionResult
  individusValides: ReadonlyArray<{ publicId: string }>
  colonne?: string | undefined
  warnings: WarningApplication[]
}): ((libelle: string, ligne: number) => string | null) => {
  const publicIdsValides = new Set(individusValides.map((individu) => individu.publicId))
  const libelleVersPublicId = new Map<string, string>()
  for (const entree of resolution.mapping) {
    if (!publicIdsValides.has(entree.individuPublicId)) {
      warnings.push(
        warnIndividuHallucine({ publicId: entree.individuPublicId, libelle: entree.libelleSource }),
      )
      continue
    }
    libelleVersPublicId.set(entree.libelleSource, entree.individuPublicId)
  }

  const libellesNonResolus = new Map<string, string>(
    resolution.nonResolus.map((entree) => [entree.libelleSource, entree.raison]),
  )
  const libellesDejaSignales = new Set<string>()

  return (libelle, ligne) => {
    const publicId = libelleVersPublicId.get(libelle)
    if (publicId) return publicId

    if (!libellesDejaSignales.has(libelle)) {
      libellesDejaSignales.add(libelle)
      const raison = libellesNonResolus.get(libelle) ?? 'Libellé non couvert par la résolution.'
      warnings.push(warnIndividuNonResolu({ libelle, ligne, raison, colonne }))
    }
    return null
  }
}

const lireLibelle = (row: Record<string, unknown>, colonne: string): string =>
  safeStringify(row[colonne]).trim()

// Cœur commun aux deux layouts. `preparerIdentification` est appelé une fois, après
// le contrôle global du type de valeur : il peut émettre ses propres warnings
// (publicIds hallucinés) avant ceux des lignes.
const appliquerAvecIdentification = ({
  plan,
  rows,
  typeValeur,
  preparerIdentification,
}: {
  plan: Plan
  rows: ReadonlyArray<Record<string, unknown>>
  typeValeur: { colonne: string; typesValeurRetenus: ReadonlyArray<string> } | null
  preparerIdentification: (warnings: WarningApplication[]) => IdentifierLigne
}): ResultatApplication => {
  const items: ItemNormalise[] = []
  const warnings: WarningApplication[] = []

  // Filtrage optionnel par type de valeur (fichiers PPG : VI/VA/VC).
  let typesRetenusSet: Set<string> | null = null
  if (typeValeur) {
    if (typeValeur.typesValeurRetenus.length === 0) {
      return resultatAucuneValeurAvancement(typeValeur.colonne)
    }
    typesRetenusSet = new Set(typeValeur.typesValeurRetenus.map(normaliserType))
  }

  // Prédicat de rejet d'une ligne selon son type de valeur (émet un warning si rejetée).
  const ligneRejeteeParType = (row: Record<string, unknown>, index: number): boolean => {
    if (!typeValeur || !typesRetenusSet) return false
    if (typesRetenusSet.has(normaliserType(row[typeValeur.colonne]))) return false
    warnings.push(
      warnLigneIgnoreeType({
        index,
        colonne: typeValeur.colonne,
        valeur: safeStringify(row[typeValeur.colonne]).trim(),
      }),
    )
    return true
  }

  const identifierLigne = preparerIdentification(warnings)

  // Item à la forme attendue : `coordonnees` seulement s'il y a lieu (mono inchangé).
  const creerItem = (identite: IdentiteLigne, date: string, valeur: number): ItemNormalise =>
    identite.coordonnees
      ? { individu: identite.individu, coordonnees: identite.coordonnees, date, valeur }
      : { individu: identite.individu, date, valeur }

  const appliquerLong = (planLong: PlanLong): void => {
    for (const [index, row] of rows.entries()) {
      if (ligneRejeteeParType(row, index)) continue
      const identite = identifierLigne(row, index)
      if (!identite) continue
      const { libelle } = identite

      const date = parseFrLibre(row[planLong.colonneDate.nom])
      if (!date) {
        warnings.push(
          warnDateInvalide({
            index,
            colonne: planLong.colonneDate.nom,
            libelle,
            brut: safeStringify(row[planLong.colonneDate.nom]).trim(),
          }),
        )
        continue
      }

      const valeurResult = parseNombre(row[planLong.colonneValeur])
      if (!valeurResult.ok) {
        warnings.push(
          warnValeurInvalide({
            index,
            colonne: planLong.colonneValeur,
            libelle,
            raison: valeurResult.raison,
            mentionColonne: false,
          }),
        )
        continue
      }

      items.push(creerItem(identite, date, valeurResult.valeur))
    }
  }

  const appliquerPivot = (planPivot: PlanPivot): void => {
    // Résolution canonique des dates d'en-tête : le parser déterministe fait autorité ;
    // le dateIso d'Albert n'est qu'un filet pour les en-têtes bruités qu'il ne tranche
    // pas (parseFrLibre renvoie null en cas de doute, jamais une date fausse).
    const dateParColonne = new Map(
      planPivot.colonnesPivot.map((colonne) => [
        colonne.nom,
        parseFrLibre(colonne.nom) ?? colonne.dateIso,
      ]),
    )

    for (const [index, row] of rows.entries()) {
      if (ligneRejeteeParType(row, index)) continue
      const identite = identifierLigne(row, index)
      if (!identite) continue
      const { libelle } = identite

      for (const colonnePivot of planPivot.colonnesPivot) {
        const valeurBrute = row[colonnePivot.nom]
        if (
          valeurBrute === null ||
          valeurBrute === undefined ||
          safeStringify(valeurBrute).trim() === ''
        ) {
          // Cellule vide en pivot : silencieux (un fichier pivot a souvent des trous).
          continue
        }
        const valeurResult = parseNombre(valeurBrute)
        if (!valeurResult.ok) {
          warnings.push(
            warnValeurInvalide({
              index,
              colonne: colonnePivot.nom,
              libelle,
              raison: valeurResult.raison,
              mentionColonne: true,
            }),
          )
          continue
        }
        items.push(creerItem(identite, dateParColonne.get(colonnePivot.nom)!, valeurResult.valeur))
      }
    }
  }

  if (plan.layout === 'long') appliquerLong(plan)
  else appliquerPivot(plan)

  return { items, warnings }
}

// Une seule colonne d'identité, résolue contre tous les individus des référentiels
// de l'indicateur (chemin historique, indicateur mono-dimension).
export const appliquerPlan = ({
  plan,
  rows,
  resolution,
  individusValides,
  typeValeur,
}: {
  plan: Plan
  rows: ReadonlyArray<Record<string, unknown>>
  resolution: ResolutionResult
  individusValides: ReadonlyArray<{ publicId: string }>
  typeValeur: { colonne: string; typesValeurRetenus: ReadonlyArray<string> } | null
}): ResultatApplication =>
  appliquerAvecIdentification({
    plan,
    rows,
    typeValeur,
    preparerIdentification: (warnings) => {
      const resoudre = indexerResolution({ resolution, individusValides, warnings })
      return (row, index) => {
        const libelle = lireLibelle(row, plan.colonneIndividu)
        if (!libelle) {
          warnings.push(warnCelluleVide({ index, colonne: plan.colonneIndividu }))
          return null
        }
        const individu = resoudre(libelle, index)
        return individu ? { individu, libelle } : null
      }
    },
  })

// Colonne d'identité d'un indicateur multi-dimension, déjà résolue contre les
// seuls membres de sa dimension. `rang` = position de la dimension dans l'ordre
// de l'indicateur (ordre canonique des coordonnées).
export type ColonneIdentiteResolue = {
  colonne: string
  rang: number
  resolution: ResolutionResult
  membres: ReadonlyArray<{ publicId: string }>
}

// Indicateur multi-dimension : une coordonnée par colonne d'identité. Une ligne
// dont une identité manque ou n'est pas résolue est écartée (`LIGNE_PARTIELLE`
// si au moins une autre l'est). `coordonnees` dès deux colonnes.
export const appliquerPlanMultiDimension = ({
  plan,
  rows,
  colonnes,
  typeValeur,
}: {
  plan: Plan
  rows: ReadonlyArray<Record<string, unknown>>
  colonnes: ReadonlyArray<ColonneIdentiteResolue>
  typeValeur: { colonne: string; typesValeurRetenus: ReadonlyArray<string> } | null
}): ResultatApplication =>
  appliquerAvecIdentification({
    plan,
    rows,
    typeValeur,
    preparerIdentification: (warnings) => {
      const resolveurs = [...colonnes]
        .sort((a, b) => a.rang - b.rang)
        .map((colonne) => ({
          colonne: colonne.colonne,
          resoudre: indexerResolution({
            resolution: colonne.resolution,
            individusValides: colonne.membres,
            colonne: colonne.colonne,
            warnings,
          }),
        }))
      const avecCoordonnees = resolveurs.length >= 2
      // Libellés dans l'ordre du plan (lisibilité des warnings), membres dans l'ordre canonique.
      const ordrePlan = colonnes.map((colonne) => colonne.colonne)

      return (row, index) => {
        const lectures = resolveurs.map(({ colonne, resoudre }) => {
          const libelle = lireLibelle(row, colonne)
          return { colonne, libelle, publicId: libelle ? resoudre(libelle, index) : null }
        })
        const libelle = ordrePlan
          .map((colonne) => lectures.find((lecture) => lecture.colonne === colonne)?.libelle ?? '')
          .join(' / ')

        if (lectures.every((lecture) => !lecture.libelle)) {
          warnings.push(warnCelluleVide({ index, colonne: ordrePlan[0]! }))
          return null
        }
        const manquantes = lectures.filter((lecture) => lecture.publicId === null)
        if (manquantes.length > 0) {
          // Rien de résolu : les libellés non résolus sont déjà signalés une fois.
          if (manquantes.length < lectures.length) {
            warnings.push(
              warnLignePartielle({
                index,
                colonnesManquantes: ordrePlan.filter((colonne) =>
                  manquantes.some((lecture) => lecture.colonne === colonne),
                ),
                libelle,
              }),
            )
          }
          return null
        }

        const membres = lectures.map((lecture) => lecture.publicId!)
        return avecCoordonnees
          ? { individu: formatCelluleId(membres), coordonnees: membres, libelle }
          : { individu: membres[0]!, libelle }
      }
    },
  })

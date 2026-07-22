import { type Plan, type PlanLong, type PlanPivot } from '@/valeurImport/calls/decouvrirStructure'
import { type ResolutionResult } from '@/valeurImport/calls/resoudreIndividus'
import { safeStringify } from '@/valeurImport/helpers/safeStringify'
import { parseFrLibre } from '@/valeurImport/parsers/parseFrLibre'
import { parseNombre } from '@/valeurImport/parsers/parseNombre'

export type ItemNormalise = { individu: string; date: string; valeur: number }

export type WarningApplication = {
  code:
    | 'INDIVIDU_NON_RESOLU'
    | 'INDIVIDU_HALLUCINE'
    | 'DATE_INVALIDE'
    | 'VALEUR_INVALIDE'
    | 'CELLULE_VIDE'
    | 'LIGNE_IGNOREE'
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
}: {
  libelle: string
  ligne: number
  raison: string
}): WarningApplication => ({
  code: 'INDIVIDU_NON_RESOLU',
  message: `« ${libelle} » : ${raison}`,
  libelleSource: libelle,
  ligneSource: ligne,
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

  // Index mapping libelle -> publicId, en filtrant les éventuels publicId
  // hallucinés (sécurité défensive — le tool refine devrait déjà l'avoir bloqué).
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

  // Pré-remonter les nonResolus en warning (mais une seule fois par libellé,
  // pas une fois par ligne, sinon ça pollue inutilement).
  const libellesNonResolus = new Map<string, string>(
    resolution.nonResolus.map((entree) => [entree.libelleSource, entree.raison]),
  )

  // Tracker pour ne signaler chaque libellé non résolu qu'une seule fois.
  const libellesDejaSignales = new Set<string>()

  const signalerLibelleNonResolu = (
    libelle: string,
    ligne: number,
  ): { individu: string | null } => {
    const publicId = libelleVersPublicId.get(libelle)
    if (publicId) return { individu: publicId }

    if (!libellesDejaSignales.has(libelle)) {
      libellesDejaSignales.add(libelle)
      const raison = libellesNonResolus.get(libelle) ?? 'Libellé non couvert par la résolution.'
      warnings.push(warnIndividuNonResolu({ libelle, ligne, raison }))
    }
    return { individu: null }
  }

  const appliquerLong = (planLong: PlanLong): void => {
    for (const [index, row] of rows.entries()) {
      if (ligneRejeteeParType(row, index)) continue
      const libelle = safeStringify(row[planLong.colonneIndividu]).trim()
      if (!libelle) {
        warnings.push(warnCelluleVide({ index, colonne: planLong.colonneIndividu }))
        continue
      }
      const { individu } = signalerLibelleNonResolu(libelle, index)
      if (!individu) continue

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

      items.push({ individu, date, valeur: valeurResult.valeur })
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
      const libelle = safeStringify(row[planPivot.colonneIndividu]).trim()
      if (!libelle) {
        warnings.push(warnCelluleVide({ index, colonne: planPivot.colonneIndividu }))
        continue
      }
      const { individu } = signalerLibelleNonResolu(libelle, index)
      if (!individu) continue

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
        items.push({
          individu,
          date: dateParColonne.get(colonnePivot.nom)!,
          valeur: valeurResult.valeur,
        })
      }
    }
  }

  if (plan.layout === 'long') appliquerLong(plan)
  else appliquerPivot(plan)

  return { items, warnings }
}

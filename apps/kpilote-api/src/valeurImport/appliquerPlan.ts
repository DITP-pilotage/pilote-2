import { type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { type ResolutionResult } from '@/valeurImport/calls/resoudreIndividus'
import { safeStringify } from '@/valeurImport/helpers/safeStringify'
import { parseDate } from '@/valeurImport/parsers/parseDate'
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
  typeValeur?: { colonne: string; typesValeurRetenus: ReadonlyArray<string> }
}): ResultatApplication => {
  const items: ItemNormalise[] = []
  const warnings: WarningApplication[] = []

  const normaliserType = (valeur: unknown): string => safeStringify(valeur).trim().toLowerCase()

  // Filtrage optionnel par type de valeur (fichiers PPG : VI/VA/VC).
  let typesRetenusSet: Set<string> | null = null
  if (typeValeur) {
    if (typeValeur.typesValeurRetenus.length === 0) {
      // Aucune valeur d'avancement identifiée : on écarte tout, un seul warning global.
      warnings.push({
        code: 'LIGNE_IGNOREE',
        message:
          `Aucune valeur d'avancement n'a pu être identifiée dans la colonne « ${typeValeur.colonne} ». ` +
          `Aucune valeur n'a été importée.`,
        colonneSource: typeValeur.colonne,
      })
      return { items, warnings }
    }
    typesRetenusSet = new Set(typeValeur.typesValeurRetenus.map(normaliserType))
  }

  // Prédicat de rejet d'une ligne selon son type de valeur (émet un warning si rejetée).
  const ligneRejeteeParType = (row: Record<string, unknown>, index: number): boolean => {
    if (!typeValeur || !typesRetenusSet) return false
    if (typesRetenusSet.has(normaliserType(row[typeValeur.colonne]))) return false
    warnings.push({
      code: 'LIGNE_IGNOREE',
      message:
        `Ligne ${index} : valeur « ${safeStringify(row[typeValeur.colonne]).trim()} » écartée ` +
        `(colonne « ${typeValeur.colonne} ») — seules les valeurs d'avancement sont importées.`,
      ligneSource: index,
      colonneSource: typeValeur.colonne,
    })
    return true
  }

  // Index mapping libelle -> publicId, en filtrant les éventuels publicId
  // hallucinés (sécurité défensive — le tool refine devrait déjà l'avoir bloqué).
  const publicIdsValides = new Set(individusValides.map((individu) => individu.publicId))
  const libelleVersPublicId = new Map<string, string>()
  for (const entree of resolution.mapping) {
    if (!publicIdsValides.has(entree.individuPublicId)) {
      warnings.push({
        code: 'INDIVIDU_HALLUCINE',
        message: `Albert a proposé un publicId inconnu (${entree.individuPublicId}) pour « ${entree.libelleSource} » — ignoré.`,
        libelleSource: entree.libelleSource,
      })
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
      warnings.push({
        code: 'INDIVIDU_NON_RESOLU',
        message: `« ${libelle} » : ${raison}`,
        libelleSource: libelle,
        ligneSource: ligne,
      })
    }
    return { individu: null }
  }

  if (plan.layout === 'long') {
    for (const [index, row] of rows.entries()) {
      if (ligneRejeteeParType(row, index)) continue
      const libelle = safeStringify(row[plan.colonneIndividu]).trim()
      if (!libelle) {
        warnings.push({
          code: 'CELLULE_VIDE',
          message: `Ligne ${index} : libellé individu vide (colonne « ${plan.colonneIndividu} »).`,
          ligneSource: index,
          colonneSource: plan.colonneIndividu,
        })
        continue
      }
      const { individu } = signalerLibelleNonResolu(libelle, index)
      if (!individu) continue

      const dateResult = parseDate(row[plan.colonneDate.nom], plan.colonneDate.format)
      if (!dateResult.ok) {
        warnings.push({
          code: 'DATE_INVALIDE',
          message: `Ligne ${index} : ${dateResult.raison}`,
          ligneSource: index,
          colonneSource: plan.colonneDate.nom,
          libelleSource: libelle,
        })
        continue
      }

      const valeurResult = parseNombre(row[plan.colonneValeur])
      if (!valeurResult.ok) {
        warnings.push({
          code: 'VALEUR_INVALIDE',
          message: `Ligne ${index} : ${valeurResult.raison}`,
          ligneSource: index,
          colonneSource: plan.colonneValeur,
          libelleSource: libelle,
        })
        continue
      }

      items.push({ individu, date: dateResult.iso, valeur: valeurResult.valeur })
    }
    return { items, warnings }
  }

  // layout === 'pivot'
  for (const [index, row] of rows.entries()) {
    if (ligneRejeteeParType(row, index)) continue
    const libelle = safeStringify(row[plan.colonneIndividu]).trim()
    if (!libelle) {
      warnings.push({
        code: 'CELLULE_VIDE',
        message: `Ligne ${index} : libellé individu vide (colonne « ${plan.colonneIndividu} »).`,
        ligneSource: index,
        colonneSource: plan.colonneIndividu,
      })
      continue
    }
    const { individu } = signalerLibelleNonResolu(libelle, index)
    if (!individu) continue

    for (const colonnePivot of plan.colonnesPivot) {
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
        warnings.push({
          code: 'VALEUR_INVALIDE',
          message: `Ligne ${index}, colonne « ${colonnePivot.nom} » : ${valeurResult.raison}`,
          ligneSource: index,
          colonneSource: colonnePivot.nom,
          libelleSource: libelle,
        })
        continue
      }
      items.push({ individu, date: colonnePivot.dateIso, valeur: valeurResult.valeur })
    }
  }

  return { items, warnings }
}

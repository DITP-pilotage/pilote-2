import { type Arbre, type Fonction, TOUS_ID } from '@/lib/axeArbre'

export const PERIODES = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin'] as const

// Saisies d'exemple : par feuille, la valeur saisie à chaque période ('' = rien de saisi).
export type SaisiesSerie = Record<string, ReadonlyArray<string>>

// - saisie : valeur saisie à cette période ;
// - reportee : rien de saisi, la dernière valeur connue est reportée ;
// - manquante : attendue (saisie à une autre période) mais pas encore de valeur ;
// - absente : jamais saisie, elle n'existe pas pour l'individu et sort du calcul ;
// - calculee : parente ou « Tous », agrégée depuis ses enfants.
export type StatutCellule = 'saisie' | 'reportee' | 'manquante' | 'absente' | 'calculee'

export type Cellule = {
  value: number | null
  statut: StatutCellule
  present: number
  expected: number
}

const parseSaisie = (raw: string | undefined): number | null => {
  const normalized = raw?.replace(',', '.').trim()
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isNaN(value) ? null : value
}

const feuilleSerie = (saisies: ReadonlyArray<string> | undefined): Cellule[] => {
  const values = PERIODES.map((_, index) => parseSaisie(saisies?.[index]))
  const observee = values.some((value) => value !== null)
  let derniere: number | null = null
  return values.map((value) => {
    if (value !== null) {
      derniere = value
      return { value, statut: 'saisie', present: 1, expected: 1 }
    }
    if (!observee) return { value: null, statut: 'absente', present: 0, expected: 0 }
    if (derniere === null) return { value: null, statut: 'manquante', present: 0, expected: 1 }
    return { value: derniere, statut: 'reportee', present: 1, expected: 1 }
  })
}

const aggregate = ({
  values,
  fonction,
}: {
  values: ReadonlyArray<number>
  fonction: Fonction
}): number => {
  const sum = values.reduce((total, value) => total + value, 0)
  return fonction === 'SUM' ? sum : sum / values.length
}

// Sémantique du moteur pour un individu saisi (spec multifiltre §5) : une modalité jamais
// saisie n'est pas attendue ; une modalité saisie une fois est attendue sur toute la période,
// manquante avant sa première valeur, reportée ensuite. Chaque niveau combine ses enfants
// attendus qui ont une valeur.
export const computeSerie = ({
  arbre,
  saisies,
  fonction,
}: {
  arbre: Arbre
  saisies: SaisiesSerie
  fonction: Fonction
}): Map<string, Cellule[]> => {
  const result = new Map<string, Cellule[]>()
  const visit = (id: string): Cellule[] => {
    const node = arbre.get(id)
    if (!node) return []
    if (node.kind === 'feuille') {
      const serie = feuilleSerie(saisies[id])
      result.set(id, serie)
      return serie
    }
    const enfants = node.children.map(visit)
    const serie = PERIODES.map((_, index): Cellule => {
      const cellules = enfants.map((enfant) => enfant[index]).filter((cellule) => !!cellule)
      const attendues = cellules.filter((cellule) => cellule.statut !== 'absente')
      const values = attendues.flatMap((cellule) => (cellule.value === null ? [] : [cellule.value]))
      if (attendues.length === 0) return { value: null, statut: 'absente', present: 0, expected: 0 }
      return {
        value: values.length === 0 ? null : aggregate({ values, fonction }),
        statut: 'calculee',
        present: values.length,
        expected: attendues.length,
      }
    })
    result.set(id, serie)
    return serie
  }
  visit(TOUS_ID)
  return result
}

// Générateur pseudo-aléatoire déterministe : le même axe donne toujours le même exemple.
const seededRandom = (seed: number) => {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

// Un exemple qui montre tous les cas : des feuilles jamais saisies, d'autres qui démarrent en
// cours de période, et des trous comblés par le report.
export const buildExempleSaisies = ({
  arbre,
  seed = 1,
}: {
  arbre: Arbre
  seed?: number
}): SaisiesSerie => {
  const random = seededRandom(seed)
  const feuilles = [...arbre.values()].filter((node) => node.kind === 'feuille')
  return Object.fromEntries(
    feuilles.map((feuille, rang) => {
      const jamaisSaisie = rang > 0 && random() < 0.15
      if (jamaisSaisie) return [feuille.id, PERIODES.map(() => '')]
      const debut = random() < 0.3 ? 1 + Math.floor(random() * 3) : 0
      let value = Math.round(random() * 80 + 10)
      const serie = PERIODES.map((_, index) => {
        if (index < debut) return ''
        if (index > debut && random() < 0.25) return ''
        value = Math.max(0, value + Math.round((random() - 0.4) * 12))
        return String(value)
      })
      return [feuille.id, serie]
    }),
  )
}

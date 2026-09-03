import { type Tile, type View } from '@pilote/kpilote-shared/assistant/tiles'

export type ViewContext = {
  indicateurs: ReadonlyArray<string>
  collections: ReadonlyArray<string>
  individus: ReadonlyArray<string>
  referentiels: ReadonlyArray<string>
}

// Une année ou un identifiant ne sont pas des mesures. Ce qui est proscrit, c'est un nombre
// présenté comme une valeur : suivi d'un `%`, ou d'un mot qui en fait une quantité.
const YEAR = /^(19|20)\d{2}$/u
const NUMBER_FOLLOWED_BY = /(\d[\d\s .,]*)\s*(%|[a-zà-ÿ]{2,})/giu

/**
 * Vrai si le texte présente un nombre comme une mesure. Le paragraphe est la seule tuile
 * où le modèle écrit ; y laisser passer un chiffre reviendrait à rouvrir la porte que tout
 * le reste du design ferme.
 */
export const containsNumericValue = (text: string): boolean => {
  for (const match of text.matchAll(NUMBER_FOLLOWED_BY)) {
    const number = (match[1] ?? '').replace(/[\s ]/gu, '')
    const suffix = match[2] ?? ''
    if (suffix === '%') return true
    if (YEAR.test(number)) continue
    return true
  }
  return false
}

type TileReference = { key: keyof ViewContext; value: string; label: string }

const tileReferences = (tile: Tile): ReadonlyArray<TileReference> => {
  const references: TileReference[] = []
  if ('indicateurId' in tile) {
    references.push({ key: 'indicateurs', value: tile.indicateurId, label: 'indicateur' })
  }
  if ('collectionId' in tile) {
    references.push({ key: 'collections', value: tile.collectionId, label: 'collection' })
  }
  if ('individuId' in tile) {
    references.push({ key: 'individus', value: tile.individuId, label: 'territoire' })
  }
  if ('referentielId' in tile) {
    references.push({ key: 'referentiels', value: tile.referentielId, label: 'référentiel' })
  }
  return references
}

/**
 * Renvoie la liste des anomalies, vide si la vue est conforme. On les rend TOUTES : le
 * message est renvoyé au modèle, qui corrige en un tour plutôt qu'en autant de tours qu'il
 * y a de fautes.
 */
export const validateView = (view: View, context: ViewContext): string[] => {
  const issues: string[] = []

  view.tiles.forEach((tile, index) => {
    for (const reference of tileReferences(tile)) {
      if (!context[reference.key].includes(reference.value)) {
        issues.push(
          `Tuile ${index + 1} : le ${reference.label} ${reference.value} ne fait pas partie du contexte fourni. Utilise uniquement les identifiants du contexte.`,
        )
      }
    }

    if (tile.type === 'tile_paragraphe' && containsNumericValue(tile.text)) {
      issues.push(
        `Tuile ${index + 1} : le paragraphe contient une valeur chiffrée. Les chiffres sont affichés par les autres tuiles, qui les lisent à la source. Reformule sans nombre.`,
      )
    }
  })

  return issues
}

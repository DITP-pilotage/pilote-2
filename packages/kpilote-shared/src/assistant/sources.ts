import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'

export type SourceType = 'indicateur' | 'collection' | 'referentiel' | 'individu'

/** Ce qu'on sait d'une source à l'extraction : son type et son identifiant. */
export type SourceReference = { type: SourceType; publicId: string }

/**
 * Une source résolue. `path` est `null` pour les types qui n'ont pas de page de détail
 * dans le front : ils sont affichés sans lien plutôt qu'omis, sinon une réponse entièrement
 * fondée sur des individus afficherait « aucune source ».
 */
export type Source = SourceReference & { label: string; path: string | null }

// L'extraction est guidée par les CLÉS et non par les valeurs : `individuPublicIdSchema`
// accepte `^[A-Z][A-Z0-9-]{0,19}$`, donc un balayage de toutes les chaînes ramasserait
// `READ`, `PUBLIC` ou `SOLEIL`. Seules les clés qui portent une identité sont lues.
const KEYS_BY_TYPE: Record<SourceType, ReadonlyArray<string>> = {
  indicateur: ['indicateurId', 'indicateurPublicId'],
  collection: ['collectionId', 'collectionPublicId'],
  // `referentiel` tout court : c'est le nom du champ dans le modèle d'API d'un individu.
  referentiel: ['referentielId', 'referentielPublicId', 'referentiel'],
  individu: ['individuId', 'individuPublicId'],
}

const SCHEMAS_BY_TYPE: Record<SourceType, { safeParse: (v: unknown) => { success: boolean } }> = {
  indicateur: indicateurPublicIdSchema,
  collection: collectionPublicIdSchema,
  referentiel: referentielPublicIdSchema,
  individu: individuPublicIdSchema,
}

// Les modèles d'API exposent leur identifiant public sous `id` (c'est `publicId` côté
// Prisma seulement), et les fixtures sous `publicId` : les deux clés sont ambiguës, on
// résout le type par le préfixe de la valeur.
const PREFIXED_TYPES: ReadonlyArray<SourceType> = ['indicateur', 'collection', 'referentiel']
const AMBIGUOUS_KEYS: ReadonlyArray<string> = ['publicId', 'id']

// L'individu n'a aucun préfixe discriminant : `DEPT-84` ne se distingue pas d'un mot en
// capitales. Sous une clé ambiguë, on ne le retient donc que si l'objet porte aussi un
// champ `referentiel` — obligatoire dans le modèle d'individu, donc un signal stable.
const INDIVIDU_MARKER_KEY = 'referentiel'

const typeFromKey = (key: string): SourceType | null => {
  for (const type of Object.keys(KEYS_BY_TYPE) as SourceType[]) {
    if (KEYS_BY_TYPE[type].includes(key)) return type
  }
  return null
}

const typeFromValue = (value: string): SourceType | null =>
  PREFIXED_TYPES.find((type) => SCHEMAS_BY_TYPE[type].safeParse(value).success) ?? null

export const extractReferences = (value: unknown): SourceReference[] => {
  const found: SourceReference[] = []
  const seen = new Set<string>()

  const add = (type: SourceType, publicId: string): void => {
    if (!SCHEMAS_BY_TYPE[type].safeParse(publicId).success) return
    const key = `${type}:${publicId}`
    if (seen.has(key)) return
    seen.add(key)
    found.push({ type, publicId })
  }

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (node === null || typeof node !== 'object') return

    const object = node as Record<string, unknown>
    const looksLikeIndividu = typeof object[INDIVIDU_MARKER_KEY] === 'string'

    for (const [key, content] of Object.entries(object)) {
      if (typeof content === 'string') {
        const explicitType = typeFromKey(key)
        if (explicitType) {
          add(explicitType, content)
          continue
        }
        if (AMBIGUOUS_KEYS.includes(key)) {
          const inferredType = typeFromValue(content)
          if (inferredType) add(inferredType, content)
          else if (looksLikeIndividu) add('individu', content)
        }
        continue
      }
      walk(content)
    }
  }

  walk(value)
  return found
}

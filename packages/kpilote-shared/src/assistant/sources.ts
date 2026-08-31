import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  referentielPublicIdSchema,
} from '../publicIds'

export type TypeSource = 'indicateur' | 'collection' | 'referentiel' | 'individu'

/** Ce qu'on sait d'une source à l'extraction : son type et son identifiant. */
export type ReferenceSource = { type: TypeSource; publicId: string }

/**
 * Une source résolue. `chemin` est `null` pour les types qui n'ont pas de page de détail
 * dans le front : ils sont affichés sans lien plutôt qu'omis, sinon une réponse entièrement
 * fondée sur des individus afficherait « aucune source ».
 */
export type Source = ReferenceSource & { libelle: string; chemin: string | null }

// L'extraction est guidée par les CLÉS et non par les valeurs : `individuPublicIdSchema`
// accepte `^[A-Z][A-Z0-9-]{0,19}$`, donc un balayage de toutes les chaînes ramasserait
// `READ`, `PUBLIC` ou `SOLEIL`. Seules les clés qui portent une identité sont lues.
const CLES_PAR_TYPE: Record<TypeSource, ReadonlyArray<string>> = {
  indicateur: ['indicateurId', 'indicateurPublicId'],
  collection: ['collectionId', 'collectionPublicId'],
  // `referentiel` tout court : c'est le nom du champ dans le modèle d'API d'un individu.
  referentiel: ['referentielId', 'referentielPublicId', 'referentiel'],
  individu: ['individuId', 'individuPublicId'],
}

const SCHEMAS_PAR_TYPE: Record<TypeSource, { safeParse: (v: unknown) => { success: boolean } }> = {
  indicateur: indicateurPublicIdSchema,
  collection: collectionPublicIdSchema,
  referentiel: referentielPublicIdSchema,
  individu: individuPublicIdSchema,
}

// Les modèles d'API exposent leur identifiant public sous `id` (c'est `publicId` côté
// Prisma seulement), et les fixtures sous `publicId` : les deux clés sont ambiguës, on
// résout le type par le préfixe de la valeur.
const TYPES_A_PREFIXE: ReadonlyArray<TypeSource> = ['indicateur', 'collection', 'referentiel']
const CLES_AMBIGUES: ReadonlyArray<string> = ['publicId', 'id']

// L'individu n'a aucun préfixe discriminant : `DEPT-84` ne se distingue pas d'un mot en
// capitales. Sous une clé ambiguë, on ne le retient donc que si l'objet porte aussi un
// champ `referentiel` — obligatoire dans le modèle d'individu, donc un signal stable.
const CLE_TEMOIN_INDIVIDU = 'referentiel'

const typeDepuisCle = (cle: string): TypeSource | null => {
  for (const type of Object.keys(CLES_PAR_TYPE) as TypeSource[]) {
    if (CLES_PAR_TYPE[type].includes(cle)) return type
  }
  return null
}

const typeDepuisValeur = (valeur: string): TypeSource | null =>
  TYPES_A_PREFIXE.find((type) => SCHEMAS_PAR_TYPE[type].safeParse(valeur).success) ?? null

export const extraireReferences = (valeur: unknown): ReferenceSource[] => {
  const trouvees: ReferenceSource[] = []
  const vues = new Set<string>()

  const ajouter = (type: TypeSource, publicId: string): void => {
    if (!SCHEMAS_PAR_TYPE[type].safeParse(publicId).success) return
    const cle = `${type}:${publicId}`
    if (vues.has(cle)) return
    vues.add(cle)
    trouvees.push({ type, publicId })
  }

  const parcourir = (noeud: unknown): void => {
    if (Array.isArray(noeud)) {
      noeud.forEach(parcourir)
      return
    }
    if (noeud === null || typeof noeud !== 'object') return

    const objet = noeud as Record<string, unknown>
    const ressembleAUnIndividu = typeof objet[CLE_TEMOIN_INDIVIDU] === 'string'

    for (const [cle, contenu] of Object.entries(objet)) {
      if (typeof contenu === 'string') {
        const typeExplicite = typeDepuisCle(cle)
        if (typeExplicite) {
          ajouter(typeExplicite, contenu)
          continue
        }
        if (CLES_AMBIGUES.includes(cle)) {
          const typeDeduit = typeDepuisValeur(contenu)
          if (typeDeduit) ajouter(typeDeduit, contenu)
          else if (ressembleAUnIndividu) ajouter('individu', contenu)
        }
        continue
      }
      parcourir(contenu)
    }
  }

  parcourir(valeur)
  return trouvees
}

import {
  type Source,
  type SourceReference,
  type SourceType,
} from '@pilote/kpilote-shared/assistant/sources'

import { listCollections } from '@/collection/queries/listCollections'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listIndividus } from '@/individu/queries/listIndividus'
import { listReferentiels } from '@/referentiel/queries/listReferentiels'

// Les quatre queries filtrent par `ids` : BATCH_SIZE borne le nombre de sources
// CITÉES dans un tour, pas la taille du catalogue. Un tour qui dépasserait cent
// entités distinctes n'existe pas — les entrées d'outils sont déjà bornées bien
// en dessous.
const BATCH_SIZE = 100

// Les quatre types sont résolus, mais seuls deux ont une page de détail dans le front.
// Individus et référentiels sont affichés SANS lien plutôt qu'omis : une réponse entièrement
// fondée sur des individus afficherait sinon « aucune source », ce qui serait faux.
const PATHS: Record<SourceType, ((publicId: string) => string) | null> = {
  indicateur: (publicId) => `/indicateurs/${publicId}`,
  collection: (publicId) => `/collections/${publicId}`,
  individu: null,
  referentiel: null,
}

type ResolvedEntite = { id: string; nom: string }

const idsOfType = (references: ReadonlyArray<SourceReference>, type: SourceType): string[] =>
  references.filter((reference) => reference.type === type).map((reference) => reference.publicId)

/**
 * Résout les libellés en lot. La résolution repasse par les queries, donc par les filtres
 * d'habilitation : une source que l'utilisateur ne peut pas lire disparaît du panneau. Le
 * sourcing est aussi un dernier filet de sécurité.
 */
export const resolveSources = async (references: SourceReference[]): Promise<Source[]> => {
  const load = async (
    ids: string[],
    query: (ids: string[]) => Promise<ResolvedEntite[]>,
  ): Promise<ResolvedEntite[]> => (ids.length === 0 ? [] : query(ids))

  const [indicateurs, collections, referentiels, individus] = await Promise.all([
    load(idsOfType(references, 'indicateur'), (ids) =>
      listIndicateurs({ ids, pageSize: BATCH_SIZE }).match(
        (data) => data.items,
        () => [],
      ),
    ),
    load(idsOfType(references, 'collection'), (ids) =>
      listCollections({ ids, pageSize: BATCH_SIZE }).match(
        (data) => data.items,
        () => [],
      ),
    ),
    load(idsOfType(references, 'referentiel'), (ids) =>
      listReferentiels({ ids, pageSize: BATCH_SIZE }).match(
        (data) => data.items,
        () => [],
      ),
    ),
    load(idsOfType(references, 'individu'), (ids) =>
      listIndividus({ ids, pageSize: BATCH_SIZE }).match(
        (data) => data.items,
        () => [],
      ),
    ),
  ])

  // Les modèles d'API portent leur identifiant public sous `id`, pas `publicId`.
  const labels = new Map<string, string>([
    ...indicateurs.map((item): [string, string] => [`indicateur:${item.id}`, item.nom]),
    ...collections.map((item): [string, string] => [`collection:${item.id}`, item.nom]),
    ...referentiels.map((item): [string, string] => [`referentiel:${item.id}`, item.nom]),
    ...individus.map((item): [string, string] => [`individu:${item.id}`, item.nom]),
  ])

  return references.flatMap((reference) => {
    const label = labels.get(`${reference.type}:${reference.publicId}`)
    if (label === undefined) return []
    const buildPath = PATHS[reference.type]
    return [{ ...reference, label, path: buildPath ? buildPath(reference.publicId) : null }]
  })
}

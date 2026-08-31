import {
  type ReferenceSource,
  type Source,
  type TypeSource,
} from '@pilote/kpilote-shared/assistant/sources'

import { listCollections } from '@/collection/queries/listCollections'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listIndividus } from '@/individu/queries/listIndividus'
import { listReferentiels } from '@/referentiel/queries/listReferentiels'

const TAILLE_LOT = 100

// Les quatre types sont résolus, mais seuls deux ont une page de détail dans le front.
// Individus et référentiels sont affichés SANS lien plutôt qu'omis : une réponse entièrement
// fondée sur des individus afficherait sinon « aucune source », ce qui serait faux.
const CHEMINS: Record<TypeSource, ((publicId: string) => string) | null> = {
  indicateur: (publicId) => `/indicateurs/${publicId}`,
  collection: (publicId) => `/collections/${publicId}`,
  individu: null,
  referentiel: null,
}

type EntiteResolue = { id: string; nom: string }

const idsDeType = (references: ReadonlyArray<ReferenceSource>, type: TypeSource): string[] =>
  references.filter((reference) => reference.type === type).map((reference) => reference.publicId)

/**
 * Résout les libellés en lot. La résolution repasse par les queries, donc par les filtres
 * d'habilitation : une source que l'utilisateur ne peut pas lire disparaît du panneau. Le
 * sourcing est aussi un dernier filet de sécurité.
 */
export const resoudreSources = async (references: ReferenceSource[]): Promise<Source[]> => {
  const charger = async (
    ids: string[],
    query: (ids: string[]) => Promise<EntiteResolue[]>,
  ): Promise<EntiteResolue[]> => (ids.length === 0 ? [] : query(ids))

  const [indicateurs, collections, referentiels, individus] = await Promise.all([
    charger(idsDeType(references, 'indicateur'), (ids) =>
      listIndicateurs({ ids, pageSize: TAILLE_LOT }).match(
        (data) => data.items,
        () => [],
      ),
    ),
    charger(idsDeType(references, 'collection'), (ids) =>
      listCollections({ ids, pageSize: TAILLE_LOT }).match(
        (data) => data.items,
        () => [],
      ),
    ),
    // Référentiels et individus n'ont pas de filtre `ids` sur leur query : on filtre après
    // chargement. Si leur volumétrie dépasse TAILLE_LOT, leur ajouter `ids` comme on l'a
    // fait pour les collections, plutôt que d'augmenter la page.
    charger(idsDeType(references, 'referentiel'), async (ids) => {
      const items = await listReferentiels({ pageSize: TAILLE_LOT }).match(
        (data) => data.items,
        () => [],
      )
      return items.filter((item) => ids.includes(item.id))
    }),
    charger(idsDeType(references, 'individu'), async (ids) => {
      const items = await listIndividus({ pageSize: TAILLE_LOT }).match(
        (data) => data.items,
        () => [],
      )
      return items.filter((item) => ids.includes(item.id))
    }),
  ])

  // Les modèles d'API portent leur identifiant public sous `id`, pas `publicId`.
  const libelles = new Map<string, string>([
    ...indicateurs.map((item): [string, string] => [`indicateur:${item.id}`, item.nom]),
    ...collections.map((item): [string, string] => [`collection:${item.id}`, item.nom]),
    ...referentiels.map((item): [string, string] => [`referentiel:${item.id}`, item.nom]),
    ...individus.map((item): [string, string] => [`individu:${item.id}`, item.nom]),
  ])

  return references.flatMap((reference) => {
    const libelle = libelles.get(`${reference.type}:${reference.publicId}`)
    if (libelle === undefined) return []
    const construireChemin = CHEMINS[reference.type]
    return [
      {
        ...reference,
        libelle,
        chemin: construireChemin ? construireChemin(reference.publicId) : null,
      },
    ]
  })
}

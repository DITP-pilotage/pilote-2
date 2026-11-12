import { db } from '@/framework/persistence/dbStore'

// Clé de la combinaison vide (aucune modalité), créée par la migration
// `combinaisons` : elle porte les valeurs des indicateurs sans axe.
export const CLE_COMBINAISON_VIDE = ''

// Identité textuelle d'une combinaison : les uuids de ses modalités, triés et
// joints par `,`. Elle rend la combinaison retrouvable (ou créable sans
// doublon, via `ON CONFLICT (cle)`) à partir de ses seules modalités.
export const cleCombinaison = ({ modaliteIds }: { modaliteIds: ReadonlyArray<string> }): string =>
  [...modaliteIds].sort().join(',')

// La combinaison vide est retrouvée par sa clé, pas par un id figé.
export const trouverCombinaisonVideId = async (): Promise<string> => {
  const combinaison = await db().combinaison.findUniqueOrThrow({
    where: { cle: CLE_COMBINAISON_VIDE },
  })
  return combinaison.id
}

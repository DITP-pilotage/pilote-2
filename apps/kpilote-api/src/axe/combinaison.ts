import { uuidv7 } from 'uuidv7'

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

// Une combinaison décrite par ses modalités (une par axe ; aucune pour la
// combinaison vide).
export type ModalitesCombinaison = ReadonlyArray<{ id: string; axeId: string }>

export const cleDeModalites = (modalites: ModalitesCombinaison): string =>
  cleCombinaison({ modaliteIds: modalites.map((modalite) => modalite.id) })

// Retrouve les combinaisons par leur clé et crée celles qui manquent. Renvoie
// clé → id. Idempotent et sûr en concurrence : deux écritures qui créent la
// même combinaison passent par `ON CONFLICT (cle) DO NOTHING` (`skipDuplicates`),
// puis chacune relit l'id retenu pour sa clé.
export const trouverOuCreerCombinaisons = async ({
  combinaisons,
}: {
  combinaisons: ReadonlyArray<ModalitesCombinaison>
}): Promise<Map<string, string>> => {
  const modalitesParCle = new Map(
    combinaisons.map((modalites) => [cleDeModalites(modalites), modalites]),
  )
  const cles = [...modalitesParCle.keys()]
  const relire = async (): Promise<Map<string, string>> => {
    const lignes = await db().combinaison.findMany({ where: { cle: { in: cles } } })
    return new Map(lignes.map((combinaison) => [combinaison.cle, combinaison.id]))
  }

  const existantes = await relire()
  const manquantes = cles.filter((cle) => !existantes.has(cle))
  if (manquantes.length === 0) return existantes

  await db().combinaison.createMany({
    data: manquantes.map((cle) => ({ id: uuidv7(), cle })),
    skipDuplicates: true,
  })
  const idParCle = await relire()
  await db().combinaisonModalite.createMany({
    data: manquantes.flatMap((cle) =>
      modalitesParCle.get(cle)!.map((modalite) => ({
        combinaisonId: idParCle.get(cle)!,
        axeId: modalite.axeId,
        modaliteId: modalite.id,
      })),
    ),
    skipDuplicates: true,
  })
  return idParCle
}

// L'id de la combinaison de ces modalités, si elle existe déjà.
export const trouverCombinaisonId = async ({
  modalites,
}: {
  modalites: ModalitesCombinaison
}): Promise<string | null> => {
  const combinaison = await db().combinaison.findUnique({
    where: { cle: cleDeModalites(modalites) },
  })
  return combinaison?.id ?? null
}

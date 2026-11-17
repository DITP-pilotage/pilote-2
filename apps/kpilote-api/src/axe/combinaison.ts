import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'

// Clé de la combinaison vide (aucune modalité), créée par la migration
// `combinaisons` : elle porte les valeurs des indicateurs sans axe.
export const EMPTY_COMBINAISON_KEY = ''

// Une combinaison décrite par ses modalités (une par axe ; aucune pour la
// combinaison vide).
export type ModalitesCombinaison = ReadonlyArray<{ id: string; axeId: string }>

// Identité textuelle d'une combinaison : les uuids de ses modalités, triés et
// joints par `,`. Elle rend la combinaison retrouvable (ou créable sans
// doublon, via `ON CONFLICT (cle)`) à partir de ses seules modalités.
export const combinaisonKey = ({
  modalites,
}: {
  modalites: ReadonlyArray<{ id: string }>
}): string =>
  modalites
    .map((modalite) => modalite.id)
    .sort()
    .join(',')

// La combinaison vide est retrouvée par sa clé, pas par un id figé.
export const getEmptyCombinaisonId = async (): Promise<string> => {
  const combinaison = await db().combinaison.findUniqueOrThrow({
    where: { cle: EMPTY_COMBINAISON_KEY },
  })
  return combinaison.id
}

const loadIdsByKey = async ({
  keys,
}: {
  keys: ReadonlyArray<string>
}): Promise<Map<string, string>> => {
  const combinaisons = await db().combinaison.findMany({ where: { cle: { in: [...keys] } } })
  return new Map(combinaisons.map((combinaison) => [combinaison.cle, combinaison.id]))
}

// Retrouve les combinaisons par leur clé et crée celles qui manquent. Renvoie
// clé → id. Idempotent et sûr en concurrence : deux écritures qui créent la
// même combinaison passent par `ON CONFLICT (cle) DO NOTHING` (`skipDuplicates`),
// puis chacune relit l'id retenu pour sa clé.
export const upsertCombinaisons = async ({
  combinaisons,
}: {
  combinaisons: ReadonlyArray<ModalitesCombinaison>
}): Promise<Map<string, string>> => {
  const modalitesByKey = new Map(
    combinaisons.map((modalites) => [combinaisonKey({ modalites }), modalites]),
  )
  const keys = [...modalitesByKey.keys()]

  const existingIds = await loadIdsByKey({ keys })
  const missingKeys = keys.filter((key) => !existingIds.has(key))
  if (missingKeys.length === 0) return existingIds

  await db().combinaison.createMany({
    data: missingKeys.map((key) => ({ id: uuidv7(), cle: key })),
    skipDuplicates: true,
  })
  const idByKey = await loadIdsByKey({ keys })
  await db().combinaisonModalite.createMany({
    data: missingKeys.flatMap((key) =>
      modalitesByKey.get(key)!.map((modalite) => ({
        combinaisonId: idByKey.get(key)!,
        axeId: modalite.axeId,
        modaliteId: modalite.id,
      })),
    ),
    skipDuplicates: true,
  })
  return idByKey
}

// Une seule combinaison : son id, après l'avoir créée si besoin.
export const upsertCombinaison = async ({
  modalites,
}: {
  modalites: ModalitesCombinaison
}): Promise<string> => {
  const idByKey = await upsertCombinaisons({ combinaisons: [modalites] })
  return idByKey.get(combinaisonKey({ modalites }))!
}

import { groupBy, keyBy } from 'es-toolkit'

import { findUnknown } from '@/framework/collections/findUnknown'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { getIndividusRacinesForIndicateurs } from '@/generated/prisma/sql'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

// Individu sur lequel se lit chaque indicateur d'un lot.
// - Sans sélection : son individu racine (voir getIndividusRacinesForIndicateurs.sql).
// - Avec sélection : le premier individu sélectionné dont le référentiel lui est
//   lié. On ne remonte pas vers un ancêtre : un indicateur qu'aucun individu
//   sélectionné ne concerne n'a pas d'individu cible.
// Un indicateur sans individu cible est absent de la Map. Un individu
// sélectionné inconnu lève une 404.
export const resolveIndividusCibles = async ({
  selectedPublicIds,
  indicateurIds,
}: {
  selectedPublicIds: ReadonlyArray<string> | undefined
  indicateurIds: ReadonlyArray<string>
}): Promise<ReadonlyMap<string, IndividuRef>> => {
  if (selectedPublicIds === undefined) return loadIndividusRacines(indicateurIds)

  const selectedIndividus = await loadSelectedIndividus(selectedPublicIds)
  const links = await db().indicateurReferentiel.findMany({
    where: { indicateurId: { in: [...indicateurIds] } },
  })
  const linksByIndicateur = groupBy(links, (link) => link.indicateurId)

  const individusCibles = new Map<string, IndividuRef>()
  for (const indicateurId of indicateurIds) {
    const linkedReferentielIds = new Set(
      (linksByIndicateur[indicateurId] ?? []).map((link) => link.referentielId),
    )
    const individuCible = selectedIndividus.find((individu) =>
      linkedReferentielIds.has(individu.referentielId),
    )
    if (individuCible) individusCibles.set(indicateurId, individuCible)
  }
  return individusCibles
}

const loadIndividusRacines = async (
  indicateurIds: ReadonlyArray<string>,
): Promise<ReadonlyMap<string, IndividuRef>> => {
  if (indicateurIds.length === 0) return new Map()
  const racines = await db().$queryRawTyped(getIndividusRacinesForIndicateurs([...indicateurIds]))
  return new Map(
    racines.map(({ indicateurId, id, publicId, referentielId }) => [
      indicateurId,
      { id, publicId, referentielId },
    ]),
  )
}

// Les individus sélectionnés, dans l'ordre de la sélection.
const loadSelectedIndividus = async (publicIds: ReadonlyArray<string>): Promise<IndividuRef[]> => {
  const individus = await db().individu.findMany({ where: { publicId: { in: [...publicIds] } } })
  const inconnus = findUnknown({
    requested: publicIds,
    found: individus.map((individu) => individu.publicId),
  })
  if (inconnus.length > 0) {
    throw new NotFoundError('Individus introuvables', { individus: inconnus })
  }
  const individuByPublicId = keyBy(individus, (individu) => individu.publicId)
  return publicIds.flatMap((publicId) => individuByPublicId[publicId] ?? [])
}

import { unique } from '@/framework/array'
import { db } from '@/framework/persistence/dbStore'

type IndividuRow = { id: string; publicId: string; referentielId: string }

export type IndividusContext = {
  individuByPublicId: ReadonlyMap<string, IndividuRow>
  // Parmi les référentiels des individus chargés, ceux qui sont liés à l'indicateur.
  referentielIdsLies: ReadonlySet<string>
}

// Contexte de `checkIndividuRattache`, en deux requêtes quel que soit le
// nombre d'individus : une écriture unitaire en passe un, un lot tous les siens.
export const loadIndividusContext = async ({
  indicateurId,
  individuPublicIds,
}: {
  indicateurId: string
  individuPublicIds: ReadonlyArray<string>
}): Promise<IndividusContext> => {
  const individus = await db().individu.findMany({
    where: { publicId: { in: unique(individuPublicIds) } },
    select: { id: true, publicId: true, referentielId: true },
  })
  const liens = await db().indicateurReferentiel.findMany({
    where: {
      indicateurId,
      referentielId: { in: unique(individus.map((individu) => individu.referentielId)) },
    },
    select: { referentielId: true },
  })
  return {
    individuByPublicId: new Map(individus.map((individu) => [individu.publicId, individu])),
    referentielIdsLies: new Set(liens.map((lien) => lien.referentielId)),
  }
}

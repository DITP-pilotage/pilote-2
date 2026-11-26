import { db } from '@/framework/persistence/dbStore'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

export type ReferentielWithIndividus = {
  id: string
  publicId: string
  individus: IndividuRef[]
}

// Des référentiels avec tous leurs individus : la population sur laquelle se
// calculent médianes et valeurs remarquables. Les référentiels demandés, et
// ceux des individus demandés.
export const loadReferentielsWithIndividus = async ({
  referentielPublicIds,
  individuPublicIds = [],
}: {
  referentielPublicIds: ReadonlyArray<string>
  individuPublicIds?: ReadonlyArray<string>
}): Promise<ReferentielWithIndividus[]> => {
  const rows = await db().referentiel.findMany({
    where: {
      OR: [
        { publicId: { in: [...referentielPublicIds] } },
        { individus: { some: { publicId: { in: [...individuPublicIds] } } } },
      ],
    },
    orderBy: { publicId: 'asc' },
    include: { individus: { orderBy: { publicId: 'asc' } } },
  })
  return rows.map((row) => ({
    id: row.id,
    publicId: row.publicId,
    individus: row.individus.map(({ id, publicId, referentielId }) => ({
      id,
      publicId,
      referentielId,
    })),
  }))
}

import { db } from '@/framework/persistence/dbStore'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'
import { type ObjectifBrut, type ValeurBrute } from '@/tauxProgression/resolveTauxProgression'
import { type ListTauxProgressionQuery } from '@pilote/mb-shared/tauxProgression'

// V2 : remplacer le findMany par resolveSerieIndividu(individuId, ctx, cache)
// après avoir construit un ResolveSerieContext via loadSousArbre + loadFonctionsAgregation.
// La signature de cette fonction ne changera pas.
export const loadValeursAvancement = async (
  indicateurId: string,
  individusCibles: IndividuRef[],
  params: ListTauxProgressionQuery,
): Promise<ValeurBrute[]> => {
  const individuIds = individusCibles.map((i) => i.id)
  const individuParId = new Map(individusCibles.map((i) => [i.id, i]))

  const rows = await db().valeurAvancement.findMany({
    where: {
      indicateurId,
      individuId: { in: individuIds },
      ...(params.dateDebut || params.dateFin
        ? {
            date: {
              ...(params.dateDebut ? { gte: params.dateDebut } : {}),
              ...(params.dateFin ? { lte: params.dateFin } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ individuId: 'asc' }, { date: 'asc' }],
  })

  return rows.flatMap((v) => {
    const individu = individuParId.get(v.individuId)
    if (!individu) return []
    return [
      {
        individuId: v.individuId,
        individuPublicId: individu.publicId,
        date: v.date,
        valeur: v.valeur,
      },
    ]
  })
}

// V2 : remplacer le findMany par resolveObjectifIndividu(individuId, ctx, cache)
// après avoir construit un ResolveObjectifContext. Adapter Map<dateCible, PointObjectifInterne>
// → ObjectifBrut[] via { dateCible, valeurCible: point.valeur }.
// La signature de cette fonction ne changera pas.
export const loadObjectifs = async (
  indicateurId: string,
  individuIds: string[],
): Promise<Map<string, ObjectifBrut[]>> => {
  const rows = await db().objectifIndicateurIndividu.findMany({
    where: { indicateurId, individuId: { in: individuIds } },
    orderBy: [{ individuId: 'asc' }, { dateCible: 'asc' }],
  })

  const objectifsParIndividu = new Map<string, ObjectifBrut[]>()
  for (const o of rows) {
    const liste = objectifsParIndividu.get(o.individuId) ?? []
    liste.push({ dateCible: o.dateCible, valeurCible: o.valeurCible })
    objectifsParIndividu.set(o.individuId, liste)
  }
  return objectifsParIndividu
}

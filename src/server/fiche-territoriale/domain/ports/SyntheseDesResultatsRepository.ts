import { SyntheseDesResultats } from '@/server/fiche-territoriale/domain/SyntheseDesResultats';

export interface SyntheseDesResultatsRepository {
  recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire: ({ listeChantierId, maille, codeInsee }: {
    listeChantierId: string[],
    maille: string,
    codeInsee: string,
  }) => Promise<Map<string, SyntheseDesResultats[]>>
}

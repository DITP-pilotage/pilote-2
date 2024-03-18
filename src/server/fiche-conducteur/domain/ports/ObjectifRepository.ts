import { Objectif } from '@/server/fiche-conducteur/domain/Objectif';

export interface ObjectifRepository {
  listerObjectifParChantierId: ({ chantierId }: { chantierId: string }) => Promise<Objectif[]>
}

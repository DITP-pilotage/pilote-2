import { Territoire } from '@/server/fiche-territoriale/domain/Territoire';

export interface TerritoireRepository {
  recupererTerritoireParCode: ({ territoireCode }: { territoireCode: string }) => Promise<Territoire>;
}

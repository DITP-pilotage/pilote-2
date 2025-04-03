import { Territoire } from '@/server/chantiers/domain/Territoire';

export interface TerritoireRepository {
  récupérerTousNew(): Promise<Territoire[]>
  recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({ territoireCode }: { territoireCode: string }): Promise<string[]>;

}

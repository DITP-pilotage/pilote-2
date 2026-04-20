import { Territoire } from "@/server/domain/territoire/Territoire.interface";

export interface TerritoireRepository {
  recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({
    territoireCode,
  }: {
    territoireCode: string;
  }): Promise<string[]>;
  récupérerTousNew(): Promise<Territoire[]>;
}

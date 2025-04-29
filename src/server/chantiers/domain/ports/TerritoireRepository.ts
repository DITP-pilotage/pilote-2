export interface TerritoireRepository {
  recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({ territoireCode }: { territoireCode: string }): Promise<string[]>;
}

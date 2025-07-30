import { IndicateurTerritoireValeurEvenement } from "@/server/import-indicateur/domain/IndicateurTerritoireValeurEvenement";
import { TypeValeur } from "@/server/import-indicateur/domain/TypeValeur";

export interface IndicateurTerritoireValeurEvenementRepository {
  recupererParIndicIdTerritoireCodeEtTypeValeur(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
  }): Promise<IndicateurTerritoireValeurEvenement[]>;
  enregistrer(evenement: IndicateurTerritoireValeurEvenement): Promise<void>;
  enregistrerTous(
    evenements: IndicateurTerritoireValeurEvenement[],
  ): Promise<void>;
}

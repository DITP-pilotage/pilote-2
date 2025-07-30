import { ValeurIndicateurTerritoireEvenement } from "@/server/import-indicateur/domain/ValeurIndicateurTerritoireEvenement";
import { TypeValeur } from "@/server/import-indicateur/domain/TypeValeur";

export interface IndicateurTerritoireValeurEvenementRepository {
  recupererParIndicIdTerritoireCodeEtTypeValeur(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
  }): Promise<ValeurIndicateurTerritoireEvenement[]>;
  enregistrer(evenement: ValeurIndicateurTerritoireEvenement): Promise<void>;
  enregistrerTous(
    evenements: ValeurIndicateurTerritoireEvenement[],
  ): Promise<void>;
}

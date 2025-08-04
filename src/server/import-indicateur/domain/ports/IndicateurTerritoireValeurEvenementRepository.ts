import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { TypeValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeValeur";

export interface IndicateurTerritoireValeurEvenementRepository {
  recupererParIndicIdTerritoireCodeEtTypeValeur(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
    // TODO - retourner directement le groupBy date avec class EvenementsSurDate
  }): Promise<IndicateurTerritoireValeurEvenement[]>;
  enregistrer(evenement: IndicateurTerritoireValeurEvenement): Promise<void>;
  enregistrerTous(
    evenements: IndicateurTerritoireValeurEvenement[],
  ): Promise<void>;
}

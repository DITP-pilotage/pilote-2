import { ValeurIndicateurTerritoireEvenement } from "@/server/import-indicateur/domain/ValeurIndicateurTerritoireEvenement";

export interface IndicateurTerritoireValeurEvenementRepository {
  recuperer(): Promise<ValeurIndicateurTerritoireEvenement[]>;
  enregistrer(evenement: ValeurIndicateurTerritoireEvenement): Promise<void>;
}

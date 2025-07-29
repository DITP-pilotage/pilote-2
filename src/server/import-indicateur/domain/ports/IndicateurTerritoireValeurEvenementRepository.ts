import { ValeurIndicateurTerritoireEvenement } from "@/server/import-indicateur/domain/ValeurIndicateurTerritoireEvenement";

export interface IndicateurTerritoireValeurEvenementRepository {
  enregistrer(evenement: ValeurIndicateurTerritoireEvenement): Promise<void>;
}

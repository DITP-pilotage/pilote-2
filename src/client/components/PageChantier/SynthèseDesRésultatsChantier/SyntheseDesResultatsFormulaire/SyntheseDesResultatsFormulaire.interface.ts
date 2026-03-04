import { MétéoSaisissable } from "@/server/domain/météo/Météo.interface";

export interface SyntheseDesResultatsFormulaireInputs {
  contenu: string;
  meteo: MétéoSaisissable;
}

import { MeteoSaisissable } from "@/server/domain/météo/Météo.interface";

export interface SyntheseDesResultatsFormulaireInputs {
  contenu: string;
  meteo: MeteoSaisissable;
}

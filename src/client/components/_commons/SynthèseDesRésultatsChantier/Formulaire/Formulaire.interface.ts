import { MétéoSaisissable } from "@/server/domain/météo/Météo.interface";

export interface SynthèseDesRésultatsFormulaireInputs {
  contenu: string;
  météo: MétéoSaisissable;
}

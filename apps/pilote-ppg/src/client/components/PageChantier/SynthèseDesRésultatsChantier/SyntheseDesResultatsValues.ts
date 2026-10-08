import {
  MeteoSaisissable,
  meteosSaisissables,
} from "@/server/domain/météo/Météo.interface";

export interface SyntheseDesResultatsValues {
  contenu: string;
  meteo: MeteoSaisissable;
}

export const toMeteoSaisissable = (
  meteo: string | undefined,
): MeteoSaisissable | undefined =>
  meteosSaisissables.find((meteoSaisissable) => meteoSaisissable === meteo);

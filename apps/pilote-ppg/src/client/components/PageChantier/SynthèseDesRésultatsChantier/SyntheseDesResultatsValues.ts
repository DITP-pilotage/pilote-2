import {
  MeteoSaisissable,
  meteosSaisissables,
} from "@/shared/meteo/Meteo.interface";

export interface SyntheseDesResultatsValues {
  contenu: string;
  meteo?: MeteoSaisissable;
}

export interface SyntheseDesResultatsPublieeValues extends SyntheseDesResultatsValues {
  meteo: MeteoSaisissable;
}

export const toMeteoSaisissable = (
  meteo: string | undefined,
): MeteoSaisissable | undefined =>
  meteosSaisissables.find((meteoSaisissable) => meteoSaisissable === meteo);

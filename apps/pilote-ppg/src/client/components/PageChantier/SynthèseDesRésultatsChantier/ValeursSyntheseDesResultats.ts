import {
  MeteoSaisissable,
  meteosSaisissables,
} from "@/server/domain/météo/Météo.interface";

export interface ValeursSyntheseDesResultats {
  contenu: string;
  meteo: MeteoSaisissable;
}

export const meteoSaisissableOuRien = (
  meteo: string | undefined,
): MeteoSaisissable | undefined =>
  meteosSaisissables.find((meteoSaisissable) => meteoSaisissable === meteo);

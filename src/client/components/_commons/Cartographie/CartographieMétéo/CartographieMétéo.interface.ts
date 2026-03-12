import { Meteo } from "@/server/domain/météo/Météo.interface";

export type CartographieDonnéesMétéo = {
  valeur: Meteo;
  territoireCode: string;
  estApplicable: boolean | null;
}[];

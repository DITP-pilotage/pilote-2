import { Meteo } from "@/shared/meteo/Meteo.interface";

export type CartographieDonnéesMétéo = {
  valeur: Meteo;
  territoireCode: string;
  estApplicable: boolean | null;
}[];

import type { CritereTriChantiers } from "@/server/chantiers/app/contrats/TriChantiers";

export const LIBELLES_TRI_CHANTIERS: Record<CritereTriChantiers, string> = {
  avancement: "Taux d'avancement",
  météo: "Météo",
  dateDeMàjDonnéesQuantitatives: "Date de mise à jour des données",
  dateDeMàjDonnéesQualitatives:
    "Date de mise à jour de la météo et de la synthèse des résultats",
  tendance: "Tendance",
  écart: "Écart",
};

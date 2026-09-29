export const CRITERES_TRI_CHANTIERS = [
  "avancement",
  "météo",
  "dateDeMàjDonnéesQuantitatives",
  "dateDeMàjDonnéesQualitatives",
  "tendance",
  "écart",
] as const;

export type CritereTriChantiers = (typeof CRITERES_TRI_CHANTIERS)[number];

export type TriChantiers = { id: CritereTriChantiers; desc: boolean };

export const TRI_CHANTIERS_PAR_DEFAUT: TriChantiers = {
  id: "avancement",
  desc: false,
};

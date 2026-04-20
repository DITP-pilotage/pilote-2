export const meteosSaisissables = [
  "ORAGE",
  "NUAGE",
  "COUVERT",
  "SOLEIL",
] as const;
export type MeteoSaisissable = (typeof meteosSaisissables)[number];

export const meteos = [
  "NON_RENSEIGNEE",
  ...meteosSaisissables,
  "NON_NECESSAIRE",
] as const;
export type Meteo = (typeof meteos)[number];

export const libellesMeteos: Record<Meteo | string, string> = {
  ORAGE: "Objectifs compromis",
  NUAGE: "Appuis nécessaires",
  COUVERT: "Objectifs atteignables",
  SOLEIL: "Objectifs sécurisés",
  NON_NECESSAIRE: "Non nécessaire",
  NON_RENSEIGNEE: "Non renseignée",
};

export type StatutSeance = "OUVERTE" | "COMPLETE" | "ANNULEE";

export function statutSeance(seance: {
  dateAnnulation: Date | null;
  nombreInscrits: number;
  nombrePlacesMax: number | null;
}): StatutSeance {
  if (seance.dateAnnulation !== null) {
    return "ANNULEE";
  }
  if (
    seance.nombrePlacesMax !== null &&
    seance.nombreInscrits >= seance.nombrePlacesMax
  ) {
    return "COMPLETE";
  }
  return "OUVERTE";
}

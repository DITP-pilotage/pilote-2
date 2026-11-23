export const DELAI_REPORT_JOURS = 7;

const DELAI_REPORT_MS = DELAI_REPORT_JOURS * 24 * 60 * 60 * 1000;

export type EtatSlideIn = {
  dateReport: Date | null;
  dateFermeture: Date | null;
};

// Pas d'état : jamais présentée. Le délai court depuis le dernier « Plus tard ».
export function doitPresenterSlideIn(
  etat: EtatSlideIn | null,
  maintenant: Date,
): boolean {
  if (etat === null) return true;
  if (etat.dateFermeture !== null) return false;
  if (
    etat.dateReport !== null &&
    maintenant.getTime() - etat.dateReport.getTime() < DELAI_REPORT_MS
  ) {
    return false;
  }
  return true;
}

// « CAMPUS PILOTE : Introduction à l'outil » devient « Introduction à l'outil ».
export function nomAffiche(nom: string): string {
  const separateur = nom.indexOf(":");
  if (separateur === -1) return nom;
  const suite = nom.slice(separateur + 1).trim();
  return suite === "" ? nom : suite;
}

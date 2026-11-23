const SEUIL_PLACES_RESTANTES = 5;

const deuxChiffres = (nombre: number) => String(nombre).padStart(2, "0");

// « Mar. 24 nov., 14 h », « Mar. 1er déc., 10 h 30 » ; fuseau du navigateur par défaut.
export function formaterDebutSeance(
  dateDebut: string,
  timeZone?: string,
): string {
  const parties = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).formatToParts(new Date(dateDebut));
  const partie = (type: Intl.DateTimeFormatPartTypes) =>
    parties.find((part) => part.type === type)?.value ?? "";

  const jour = partie("weekday");
  const quantieme = partie("day") === "1" ? "1er" : partie("day");
  const minutes = partie("minute");
  const heure = `${Number(partie("hour"))} h${minutes === "00" ? "" : ` ${minutes}`}`;

  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${quantieme} ${partie("month")}, ${heure}`;
}

// « 45 min », « 1 h », « 1 h 30 »
export function formaterDuree(dureeMinutes: number): string {
  if (dureeMinutes < 60) return `${dureeMinutes} min`;
  const heures = Math.floor(dureeMinutes / 60);
  const minutes = dureeMinutes % 60;
  return minutes === 0 ? `${heures} h` : `${heures} h ${deuxChiffres(minutes)}`;
}

export function formaterPlacesRestantes(
  placesRestantes: number | null,
): string | null {
  if (placesRestantes === null || placesRestantes > SEUIL_PLACES_RESTANTES) {
    return null;
  }
  return placesRestantes === 1
    ? "Plus qu'une place"
    : `Plus que ${placesRestantes} places`;
}

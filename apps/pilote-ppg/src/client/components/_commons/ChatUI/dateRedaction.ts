/**
 * La date de rédaction d'un encart, dans le fuseau du lecteur : formatée en
 * UTC, elle affichait la veille entre minuit et 1 h, heure de Paris.
 */
export const formaterDateRedaction = ({
  dateRedaction,
  timeZone,
}: {
  dateRedaction: string;
  /** Pour les tests : par défaut, le fuseau du navigateur. */
  timeZone?: string;
}): string =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(dateRedaction));

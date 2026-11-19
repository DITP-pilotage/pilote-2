import type {
  Bornes,
  JourISO,
} from "@/server/formations/domain/periodeInformation";

export function formaterJour(jour: JourISO): string {
  const [annee, mois, quantieme] = jour.split("-");
  return `${quantieme}/${mois}/${annee}`;
}

// « du 01/12/2026 au 31/12/2026 et du 01/01/2027 au 15/01/2027 »
export function listerPeriodes(
  periodes: (Bornes & { precision?: string })[],
): string {
  return new Intl.ListFormat("fr", { type: "conjunction" }).format(
    periodes.map(
      (periode) =>
        `du ${formaterJour(periode.dateDebut)} au ${formaterJour(periode.dateFin)}${periode.precision ? ` (${periode.precision})` : ""}`,
    ),
  );
}

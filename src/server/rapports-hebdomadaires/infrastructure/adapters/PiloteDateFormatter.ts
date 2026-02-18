import { DateTime } from "luxon";

export class PiloteDateFormatter {
  static isoDateFranceMetropolitaine(dateISO: string): string {
    return DateTime.fromISO(dateISO, { zone: "utc" })
      .setZone("Europe/Paris")
      .toFormat("dd/MM/yyyy");
  }

  static formatterDateSemaine(date: Date): string {
    const d = new Date(date);
    const jour = d.getDate();
    const jourFormate = jour === 1 ? "1er" : String(jour);
    const mois = d.toLocaleDateString("fr-FR", { month: "long" });
    return `${jourFormate} ${mois} ${d.getFullYear()}`;
  }
}

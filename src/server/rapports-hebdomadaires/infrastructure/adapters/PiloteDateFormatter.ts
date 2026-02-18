import { DateTime } from "luxon";

export class PiloteDateFormatter {
  /**
   * Convertit une date ISO UTC en format français (dd/MM/yyyy) avec timezone Europe/Paris
   * @example
   * PiloteDateFormatter.isoDateFranceMetropolitaine("2025-01-15T10:00:00Z")
   * // retourne "15/01/2025"
   */
  static isoDateFranceMetropolitaine(dateISO: string): string {
    return DateTime.fromISO(dateISO, { zone: "utc" })
      .setZone("Europe/Paris")
      .toFormat("dd/MM/yyyy");
  }

  /**
   * Formate une date en français long avec "1er" pour le premier jour du mois
   * @example
   * PiloteDateFormatter.dateFrancaiseLongue(new Date("2025-01-01"))
   * // retourne "1er janvier 2025"
   * @example
   * PiloteDateFormatter.dateFrancaiseLongue(new Date("2025-03-15"))
   * // retourne "15 mars 2025"
   */
  static dateFrancaiseLongue(date: Date): string {
    const d = new Date(date);
    const jour = d.getDate();
    const jourFormate = jour === 1 ? "1er" : String(jour);
    const mois = d.toLocaleDateString("fr-FR", { month: "long" });
    return `${jourFormate} ${mois} ${d.getFullYear()}`;
  }
}

import { DateTime } from "luxon";

export class PiloteDateFormatter {
  static isoDateFranceMetropolitaine(dateISO: string): string {
    return DateTime.fromISO(dateISO, { zone: "utc" })
      .setZone("Europe/Paris")
      .toFormat("dd/MM/yyyy");
  }
}

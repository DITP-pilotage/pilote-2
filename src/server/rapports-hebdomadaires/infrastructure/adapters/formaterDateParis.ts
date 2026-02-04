import { DateTime } from "luxon";

export function formaterDateParis(dateISO: string): string {
  return DateTime.fromISO(dateISO, { zone: "utc" })
    .setZone("Europe/Paris")
    .toFormat("dd/MM/yyyy");
}

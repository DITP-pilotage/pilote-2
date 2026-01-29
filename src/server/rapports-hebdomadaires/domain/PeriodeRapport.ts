import { DateTime } from "luxon";

export type PeriodeRapport = {
  readonly dateDebut: Date;
  readonly dateFin: Date;
};

export function calculerPeriodeDernierLundiNeufHeures({
  maintenant,
}: {
  maintenant: Date;
}): PeriodeRapport {
  const maintenantParis =
    DateTime.fromJSDate(maintenant).setZone("Europe/Paris");

  const dernierLundi = maintenantParis
    .startOf("week")
    .set({ hour: 9, minute: 0, second: 1, millisecond: 0 });

  return {
    dateDebut: dernierLundi.toJSDate(),
    dateFin: maintenant,
  };
}

export type PeriodeRapport = {
  readonly dateDebut: Date;
  readonly dateFin: Date;
};

export function calculerPeriodeDernierLundiNeufHeures(params: {
  maintenant: Date;
}): PeriodeRapport {
  const { maintenant } = params;

  // Find previous Monday
  const jourActuel = maintenant.getDay();
  const joursDepuisLundi = jourActuel === 0 ? 6 : jourActuel - 1;

  const dernierLundi = new Date(maintenant);
  dernierLundi.setDate(maintenant.getDate() - joursDepuisLundi);
  dernierLundi.setHours(9, 0, 1, 0);

  return {
    dateDebut: dernierLundi,
    dateFin: maintenant,
  };
}

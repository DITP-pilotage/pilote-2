import type { JourISO } from "@/server/formations/domain/periodeInformation";

// Prisma lit et écrit une colonne `@db.Date` comme un `Date` à minuit UTC.
export function jourDepuisDateBase(date: Date): JourISO {
  return date.toISOString().slice(0, 10);
}

export function dateBaseDepuisJour(jour: JourISO): Date {
  return new Date(`${jour}T00:00:00Z`);
}

export function bornesDepuisBase(periode: {
  date_debut: Date;
  date_fin: Date;
}): { dateDebut: JourISO; dateFin: JourISO } {
  return {
    dateDebut: jourDepuisDateBase(periode.date_debut),
    dateFin: jourDepuisDateBase(periode.date_fin),
  };
}

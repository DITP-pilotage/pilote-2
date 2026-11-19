import { DateTime } from "luxon";
import { z } from "zod";

// Jour calendaire au format "AAAA-MM-JJ" : comparable comme une chaîne, sans fuseau.
export type JourISO = string;

export type StatutPeriode = "A_VENIR" | "EN_COURS" | "PASSEE" | "SUPPRIMEE";

export type Bornes = { dateDebut: JourISO; dateFin: JourISO };

export type SaisiePeriode = Bornes & { motifIds: number[] };

export function aujourdhuiAParis(maintenant: Date): JourISO {
  return DateTime.fromJSDate(maintenant).setZone("Europe/Paris").toISODate()!;
}

// Prisma lit une colonne `@db.Date` comme un `Date` à minuit UTC.
export function jourISO(date: Date): JourISO {
  return date.toISOString().slice(0, 10);
}

export function statutPeriode(
  periode: Bornes & { supprimee: boolean },
  aujourdhui: JourISO,
): StatutPeriode {
  if (periode.supprimee) return "SUPPRIMEE";
  if (aujourdhui < periode.dateDebut) return "A_VENIR";
  if (aujourdhui > periode.dateFin) return "PASSEE";
  return "EN_COURS";
}

export function periodesChevauchees<T extends Bornes>(
  saisie: Bornes,
  periodes: T[],
): T[] {
  return periodes.filter(
    (periode) =>
      saisie.dateDebut <= periode.dateFin &&
      periode.dateDebut <= saisie.dateFin,
  );
}

// `periodeEnCours` : la période modifiée, si elle est en cours ; son début ne bouge plus.
export function schemaPeriode({
  aujourdhui,
  periodeEnCours,
}: {
  aujourdhui: JourISO;
  periodeEnCours: Bornes | null;
}) {
  const pasPassee = (message: string) =>
    z.string().refine((jour) => jour >= aujourdhui, message);

  return z
    .object({
      dateDebut: periodeEnCours
        ? z.literal(
            periodeEnCours.dateDebut,
            "La date de début d'une période en cours ne se modifie plus.",
          )
        : z
            .string()
            .min(1, { error: "Indiquez une date de début.", abort: true })
            .pipe(pasPassee("La date de début ne peut pas être passée.")),
      dateFin: z
        .string()
        .min(1, { error: "Indiquez une date de fin.", abort: true })
        .pipe(pasPassee("La date de fin ne peut pas être passée.")),
      motifIds: z
        .array(z.number().int())
        .min(1, "Choisissez au moins une formation."),
    })
    .refine(({ dateDebut, dateFin }) => dateFin >= dateDebut, {
      path: ["dateFin"],
      message:
        "La date de fin doit être égale ou postérieure à la date de début.",
    });
}

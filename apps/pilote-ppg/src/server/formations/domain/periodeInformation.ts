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

// `debutFige` : début d'une période en cours qu'on modifie, qui ne bouge plus.
export function schemaPeriode({
  aujourdhui,
  debutFige,
}: {
  aujourdhui: JourISO;
  debutFige: JourISO | null;
}) {
  return z
    .object({
      dateDebut: z.string().min(1, "Indiquez une date de début."),
      dateFin: z.string().min(1, "Indiquez une date de fin."),
      motifIds: z
        .array(z.number().int())
        .min(1, "Choisissez au moins une formation."),
    })
    .superRefine(({ dateDebut, dateFin }, contexte) => {
      if (debutFige !== null && dateDebut !== debutFige) {
        contexte.addIssue({
          code: "custom",
          path: ["dateDebut"],
          message:
            "La date de début d'une période en cours ne se modifie plus.",
        });
      } else if (debutFige === null && dateDebut && dateDebut < aujourdhui) {
        contexte.addIssue({
          code: "custom",
          path: ["dateDebut"],
          message: "La date de début ne peut pas être passée.",
        });
      }

      if (!dateFin) return;
      if (dateDebut && dateFin < dateDebut) {
        contexte.addIssue({
          code: "custom",
          path: ["dateFin"],
          message:
            "La date de fin doit être égale ou postérieure à la date de début.",
        });
      } else if (dateFin < aujourdhui) {
        contexte.addIssue({
          code: "custom",
          path: ["dateFin"],
          message: "La date de fin ne peut pas être passée.",
        });
      }
    });
}

import { DateTime } from "luxon";

// Jour calendaire au format "AAAA-MM-JJ" : comparable comme une chaîne, sans fuseau.
export type JourISO = string;

export type StatutPeriode = "A_VENIR" | "EN_COURS" | "PASSEE";

type Bornes = { dateDebut: JourISO; dateFin: JourISO };

export type SaisiePeriode = Bornes & { motifIds: number[] };

export type ErreursPeriode = Partial<
  Record<"periode" | "dateDebut" | "dateFin" | "motifIds", string>
>;

export function aujourdhuiAParis(maintenant: Date): JourISO {
  return DateTime.fromJSDate(maintenant).setZone("Europe/Paris").toISODate()!;
}

export function jourPrecedent(jour: JourISO): JourISO {
  return DateTime.fromISO(jour, { zone: "utc" })
    .minus({ days: 1 })
    .toISODate()!;
}

export function formaterJour(jour: JourISO): string {
  const [annee, mois, quantieme] = jour.split("-");
  return `${quantieme}/${mois}/${annee}`;
}

export function statutPeriode(
  periode: Bornes,
  aujourdhui: JourISO,
): StatutPeriode {
  if (aujourdhui < periode.dateDebut) return "A_VENIR";
  if (aujourdhui > periode.dateFin) return "PASSEE";
  return "EN_COURS";
}

function premierChevauchement(
  saisie: Bornes,
  autresPeriodes: Bornes[],
): Bornes | undefined {
  return [...autresPeriodes]
    .sort((premiere, seconde) =>
      premiere.dateDebut.localeCompare(seconde.dateDebut),
    )
    .find(
      (autre) =>
        saisie.dateDebut <= autre.dateFin && autre.dateDebut <= saisie.dateFin,
    );
}

export function validerPeriode({
  saisie,
  periodeModifiee,
  autresPeriodes,
  aujourdhui,
}: {
  saisie: SaisiePeriode;
  periodeModifiee: Bornes | null;
  autresPeriodes: Bornes[];
  aujourdhui: JourISO;
}): ErreursPeriode {
  const statut = periodeModifiee
    ? statutPeriode(periodeModifiee, aujourdhui)
    : null;
  if (statut === "PASSEE") {
    return { periode: "Une période passée ne se modifie plus." };
  }

  const erreurs: ErreursPeriode = {};

  if (!saisie.dateDebut) {
    erreurs.dateDebut = "Indiquez une date de début.";
  } else if (
    statut === "EN_COURS" &&
    saisie.dateDebut !== periodeModifiee?.dateDebut
  ) {
    erreurs.dateDebut =
      "La date de début d'une période en cours ne se modifie plus.";
  }

  if (!saisie.dateFin) {
    erreurs.dateFin = "Indiquez une date de fin.";
  } else if (saisie.dateDebut && saisie.dateFin < saisie.dateDebut) {
    erreurs.dateFin =
      "La date de fin doit être égale ou postérieure à la date de début.";
  } else if (
    statut === "EN_COURS" &&
    saisie.dateFin < jourPrecedent(aujourdhui)
  ) {
    erreurs.dateFin = "La date de fin ne peut pas être antérieure à hier.";
  } else if (statut !== "EN_COURS" && saisie.dateFin < aujourdhui) {
    erreurs.dateFin = "La date de fin ne peut pas être passée.";
  }

  if (saisie.motifIds.length === 0) {
    erreurs.motifIds = "Choisissez au moins une formation.";
  }

  if (
    !erreurs.dateDebut &&
    saisie.dateDebut &&
    saisie.dateFin &&
    saisie.dateFin >= saisie.dateDebut
  ) {
    const chevauchement = premierChevauchement(saisie, autresPeriodes);
    if (chevauchement) {
      erreurs.dateDebut = `Cette période chevauche celle du ${formaterJour(chevauchement.dateDebut)} au ${formaterJour(chevauchement.dateFin)}.`;
    }
  }

  return erreurs;
}

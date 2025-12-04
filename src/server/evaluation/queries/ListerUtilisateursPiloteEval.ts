import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { comparerDates } from "@/client/utils/date/date";

export type UtilisateurPiloteEval = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  dateDerniereModification: string | null;
};

export class ListerUtilisateursPiloteEval {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(): Promise<UtilisateurPiloteEval[]> {
    const utilisateurs = await this.dependencies.prisma
      .getInstance()
      .utilisateur.findMany({
        where: {
          date_desactivation: null,
          applications_accessibles: {
            has: $Enums.application_accessible.PILOTE_EVAL,
          },
        },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          profilCode: true,
        },
      });

    const utilisateurIds = utilisateurs.map((u) => u.id);

    const datesModification = await this.dependencies.prisma
      .getInstance()
      .rattachement_utilisateur_etape_jalon.groupBy({
        by: ["utilisateur_id"],
        _max: {
          updated_at: true,
        },
        where: {
          utilisateur_id: {
            in: utilisateurIds,
          },
        },
      });

    const dateDerniereModificationParUtilisateur = new Map<
      string,
      Date | null
    >();

    for (const dateModification of datesModification) {
      dateDerniereModificationParUtilisateur.set(
        dateModification.utilisateur_id,
        dateModification._max.updated_at,
      );
    }

    const utilisateursAvecDates = utilisateurs.map((utilisateur) => ({
      ...utilisateur,
      dateDerniereModification:
        dateDerniereModificationParUtilisateur
          .get(utilisateur.id)
          ?.toISOString() ?? null,
    }));

    return utilisateursAvecDates.sort(
      (a, b) =>
        -comparerDates(
          a.dateDerniereModification ?? new Date("1900-01-01").toISOString(),
          b.dateDerniereModification ?? new Date("1900-01-01").toISOString(),
        ),
    );
  }
}

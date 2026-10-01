import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { calculerMediane } from "@/client/utils/statistiques/statistiques";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import type { Inject } from "@/server/chantiers/module";

type MoyenneParTerritoire = {
  territoire_code: string;
  _avg: { taux_avancement: number | null };
};

export function calculerStatistiquesAvancement(
  listeMoyenneParTerritoire: MoyenneParTerritoire[],
): AvancementsStatistiques {
  const valeursCroissantes = listeMoyenneParTerritoire
    .map((moyenneParTerritoire) => moyenneParTerritoire._avg.taux_avancement)
    .toSorted((a, b) => (a ?? 0) - (b ?? 0));
  return {
    médiane: calculerMediane(valeursCroissantes),
    minimum: verifyValeurIsNotNullOrUndefined(valeursCroissantes.at(0)),
    maximum: verifyValeurIsNotNullOrUndefined(valeursCroissantes.at(-1)),
  };
}

export function calculerStatistiquesAvancementParChantier(
  lignes: (MoyenneParTerritoire & { id: string })[],
  chantierIds: Chantier["id"][],
): Record<Chantier["id"], AvancementsStatistiques> {
  const lignesParChantier = new Map<Chantier["id"], MoyenneParTerritoire[]>();
  for (const ligne of lignes) {
    const lignesDuChantier = lignesParChantier.get(ligne.id) ?? [];
    lignesDuChantier.push(ligne);
    lignesParChantier.set(ligne.id, lignesDuChantier);
  }
  return Object.fromEntries(
    chantierIds.map((chantierId) => [
      chantierId,
      calculerStatistiquesAvancement(lignesParChantier.get(chantierId) ?? []),
    ]),
  );
}

export class GetStatistiquesAvancementChantiersQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    habilitations: Habilitations;
    listeChantier: Chantier["id"][];
    maille: Maille;
    jalon: number;
  }): Promise<AvancementsStatistiques> {
    const prisma = this.deps.prisma.getInstance();
    const habilitation = new Habilitation(params.habilitations);
    const chantiersAutorisés =
      habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = params.listeChantier.filter((chantier) =>
      chantiersAutorisés.includes(chantier),
    );

    const listeMoyenneParTerritoire =
      await prisma.chantier_territoire_jalon.groupBy({
        by: ["territoire_code"],
        _avg: {
          taux_avancement: true,
        },
        where: {
          id: {
            in: chantiersLecture,
          },
          jalon: params.jalon,
          maille: CODES_MAILLES[params.maille],
          NOT: {
            taux_avancement: {
              equals: null,
            },
          },
        },
        orderBy: {
          _avg: {
            taux_avancement: "asc",
          },
        },
      });

    return calculerStatistiquesAvancement(listeMoyenneParTerritoire);
  }

  async executeParChantier(params: {
    habilitations: Habilitations;
    listeChantier: Chantier["id"][];
    maille: Maille;
    jalon: number;
  }): Promise<Record<Chantier["id"], AvancementsStatistiques>> {
    const prisma = this.deps.prisma.getInstance();
    const chantiersAutorisés = new Habilitation(
      params.habilitations,
    ).récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = params.listeChantier.filter((chantier) =>
      chantiersAutorisés.includes(chantier),
    );

    const lignes = await prisma.chantier_territoire_jalon.groupBy({
      by: ["id", "territoire_code"],
      _avg: {
        taux_avancement: true,
      },
      where: {
        id: {
          in: chantiersLecture,
        },
        jalon: params.jalon,
        maille: CODES_MAILLES[params.maille],
        NOT: {
          taux_avancement: {
            equals: null,
          },
        },
      },
    });

    return calculerStatistiquesAvancementParChantier(lignes, chantiersLecture);
  }
}

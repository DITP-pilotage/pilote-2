import keyBy from "lodash.keyby";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ChantierAvecIndicateursDTO = {
  id: string;
  nom: string;
  indicateurs: {
    id: string;
    nom: string;
    territoiresApplicables: string[];
  }[];
};

export class RecupererChantiersApplicablesParTerritoiresQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    territoireCodes: string[];
  }): Promise<Record<string, ChantierAvecIndicateursDTO>> {
    const prisma = this.deps.prisma.getInstance();

    const prismaChantiers = await prisma.chantier_identite.findMany({
      where: {
        statut: "PUBLIE",
        est_territorialise: true,
        chantier_territoire: {
          some: {
            territoire_code: { in: params.territoireCodes },
            est_applicable: true,
          },
        },
      },
      include: {
        indicateur_identite: {
          where: {
            statut: "PUBLIE",
            indicateur_territoire: {
              some: {
                territoire_code: { in: params.territoireCodes },
                est_applicable: true,
              },
            },
          },
          include: {
            indicateur_territoire: {
              where: {
                territoire_code: { in: params.territoireCodes },
                est_applicable: true,
              },
              select: {
                territoire_code: true,
              },
            },
          },
        },
      },
    });

    const chantiers = prismaChantiers.map((chantier) => ({
      id: chantier.id,
      nom: chantier.nom,
      indicateurs: chantier.indicateur_identite.map((indicateur) => ({
        id: indicateur.id,
        nom: indicateur.nom,
        territoiresApplicables: indicateur.indicateur_territoire.map(
          (territoire) => territoire.territoire_code,
        ),
      })),
    }));

    return keyBy(chantiers, (chantier) => chantier.id);
  }
}

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

    const chantiers = await prisma.chantier_identite.findMany({
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
      select: {
        id: true,
        nom: true,
      },
    });

    const indicateurs = await prisma.indicateur_identite.findMany({
      where: {
        statut: "PUBLIE",
        chantier_id: { in: chantiers.map((chantier) => chantier.id) },
        indicateur_territoire: {
          some: {
            territoire_code: { in: params.territoireCodes },
            est_applicable: true,
          },
        },
      },
      select: {
        id: true,
        nom: true,
        chantier_id: true,
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
    });

    const result: Record<string, ChantierAvecIndicateursDTO> = {};
    for (const chantier of chantiers) {
      result[chantier.id] = {
        id: chantier.id,
        nom: chantier.nom,
        indicateurs: indicateurs
          .filter((indicateur) => indicateur.chantier_id === chantier.id)
          .map((indicateur) => ({
            id: indicateur.id,
            nom: indicateur.nom,
            territoiresApplicables: indicateur.indicateur_territoire.map(
              (t) => t.territoire_code,
            ),
          })),
      };
    }

    return result;
  }
}

import { PrismaPilote } from "@/server/db/PrismaPilote";

export type IndicateurDTO = {
  id: string;
  nom: string;
  chantierId: string;
};

export type ChantierDTO = {
  id: string;
  nom: string;
};

export class RecupererIndicateursParChantiersQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(chantierIds: string[]): Promise<{
    chantiers: Record<string, ChantierDTO>;
    indicateurs: Record<string, IndicateurDTO[]>;
  }> {
    const prisma = this.deps.prisma.getInstance();

    const chantiersRows = await prisma.chantier_identite.findMany({
      where: {
        id: { in: chantierIds },
        statut: "PUBLIE",
      },
      select: {
        id: true,
        nom: true,
      },
    });

    const indicateursRows = await prisma.indicateur_identite.findMany({
      where: {
        chantier_id: { in: chantierIds },
        statut: "PUBLIE",
      },
      select: {
        id: true,
        nom: true,
        chantier_id: true,
      },
    });

    const chantiers: Record<string, ChantierDTO> = {};
    for (const chantier of chantiersRows) {
      chantiers[chantier.id] = { id: chantier.id, nom: chantier.nom };
    }

    const indicateurs: Record<string, IndicateurDTO[]> = {};
    for (const indic of indicateursRows) {
      if (!indicateurs[indic.chantier_id]) {
        indicateurs[indic.chantier_id] = [];
      }
      indicateurs[indic.chantier_id].push({
        id: indic.id,
        nom: indic.nom,
        chantierId: indic.chantier_id,
      });
    }

    return { chantiers, indicateurs };
  }
}

import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ChantierIdentiteResult = {
  id: string;
  nom: string;
  axe: string;
  ppg: string;
  ministeres: string[];
};

export type GetChantiersIdentiteParams = {
  chantierIds?: string[];
};

export class GetChantiersIdentiteQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(
    params: GetChantiersIdentiteParams = {},
  ): Promise<ChantierIdentiteResult[]> {
    const prisma = this.deps.prisma.getInstance();

    const chantiers = await prisma.chantier_identite.findMany({
      where: {
        statut: $Enums.type_statut.PUBLIE,
        ...(params.chantierIds !== undefined
          ? { id: { in: params.chantierIds } }
          : {}),
      },
      orderBy: { id: "asc" },
    });

    return chantiers.map((chantier) => ({
      id: chantier.id,
      nom: chantier.nom,
      axe: chantier.axe,
      ppg: chantier.ppg,
      ministeres: chantier.ministeres,
    }));
  }
}

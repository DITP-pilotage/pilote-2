import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export class RecupererChantierIdsParPerimetresQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute({
    perimetreIds,
    statuts = [$Enums.type_statut.PUBLIE],
  }: {
    perimetreIds: string[];
    statuts?: $Enums.type_statut[];
  }): Promise<string[]> {
    if (perimetreIds.length === 0) {
      return [];
    }

    const prisma = this.deps.prisma.getInstance();

    const chantiers = await prisma.chantier_identite.findMany({
      where: {
        statut: { in: statuts },
        perimetre_ids: {
          hasSome: perimetreIds,
        },
      },
      select: {
        id: true,
      },
    });

    return chantiers.map((c) => c.id);
  }
}

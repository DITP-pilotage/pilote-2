import { PrismaPilote } from "@/server/db/PrismaPilote";

export class RecupererChantierIdsParPerimetresQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(perimetreIds: string[]): Promise<string[]> {
    if (perimetreIds.length === 0) {
      return [];
    }

    const prisma = this.deps.prisma.getInstance();

    const chantiers = await prisma.chantier_identite.findMany({
      where: {
        statut: "PUBLIE",
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

import { PrismaPilote } from "@/server/db/PrismaPilote";

export class RecupererChantierIdParIndicateurIdQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(indicateurId: string): Promise<string | null> {
    const indicateur = await this.deps.prisma
      .getInstance()
      .indicateur_identite.findUnique({
        where: { id: indicateurId },
        select: { chantier_id: true },
      });

    return indicateur?.chantier_id ?? null;
  }
}

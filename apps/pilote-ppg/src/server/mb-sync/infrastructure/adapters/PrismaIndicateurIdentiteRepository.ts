import { type PrismaPilote } from "@/server/db/PrismaPilote";
import {
  type IndicateurIdentite,
  type IndicateurIdentiteRepository,
} from "@/server/mb-sync/domain/ports/IndicateurIdentiteRepository";

export class PrismaIndicateurIdentiteRepository implements IndicateurIdentiteRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }

  async findById(id: string): Promise<IndicateurIdentite | null> {
    const row = await this.prisma.indicateur_identite.findUnique({
      where: { id },
      select: { nom: true, mailles_applicables: true, unite_mesure: true },
    });
    if (!row) return null;
    return {
      nom: row.nom,
      maillesApplicables: row.mailles_applicables,
      uniteMesure: row.unite_mesure,
    };
  }
}

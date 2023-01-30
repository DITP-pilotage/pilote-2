import { chantier, PrismaClient } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { parseChantier } from '@/server/infrastructure/chantier/ChantierSQLParser';
import Chantier from '@/server/domain/chantier/Chantier.interface';

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

export default class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getById(id: string): Promise<Chantier> {
    const chantiers: chantier[] = await this.prisma.chantier.findMany({
      where: { id },
    });

    if (!chantiers || chantiers.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return parseChantier(chantiers);
  }

  async getListe(): Promise<Chantier[]> {
    const chantiers = await this.prisma.$queryRaw`
        select * from chantier where ministeres <> '{}'
    ` as chantier[];
    const chantiersGroupésParId = groupBy<chantier>(chantiers, c => c.id);

    return Object.entries(chantiersGroupésParId).map(([_, c]) => parseChantier(c));
  }

  // Donner un nom de type au record (donnéesTerritoriales ?)
  // Implémenter l'équivalent (simplifié au max) dans random repository
  async getAvancementMoyenParDépartement(périmètreIds: string[]): Promise<Record<string, number | null>> {
    const chantierRows: chantier[] = await this.prisma.$queryRaw`
        select code_insee, avg(taux_avancement) as taux_avancement
        from chantier
        where maille = 'DEPT' and ${périmètreIds} && perimetre_ids
        group by code_insee
    ;`;
    const result: Record<string, number | null> = {};
    for (const row of chantierRows) {
      result[row.code_insee] = row.taux_avancement;
    }
    return result;
  }
}

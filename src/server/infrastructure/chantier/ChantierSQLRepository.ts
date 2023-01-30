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

  // Corriger le pluriel à géométrie variable
  // Donner un nom de type au record (donnéesTerritoriales ?)
  // Implémenter l'équivalent dans random repository
  // Faire fonctionner avec plusieur périmètres
  // vérifier que Prisma nous protège de l'injection sql
  async getAvancementMoyenParDépartement(périmètreIds: string[]): Promise<Record<string, number | null>> {
    const chantierRows: chantier[] = await this.prisma.$queryRaw`
        select code_insee, taux_avancement
        from chantier
        where maille = 'DEPT' and ${périmètreIds[0]} = any(perimetre_ids);
    `;
    return { [chantierRows[0].code_insee]: chantierRows[0].taux_avancement };
  }
}

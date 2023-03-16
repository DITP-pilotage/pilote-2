import { PrismaClient } from '@prisma/client';
import Habilitations from '@/server/domain/identité/Habilitations';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';

export default class HabilitationSQLRepository implements HabilitationRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async getByUserId(userId: string): Promise<Habilitations> {
    const result: Habilitations = { chantiers: {} };
    const rows = await this._prisma.iden_chantier_habilitation.findMany({
      where: { identite_id: userId },
    });

    for (const row of rows) {
      result.chantiers[row.chantier_id] = new Set(row.scope);
    }

    return result;
  }
}

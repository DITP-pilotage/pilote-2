import { PrismaClient, utilisateur } from '@prisma/client';
import { UtilisateurRepository } from '@/server/domain/identité/UtilisateurRepository';
import { Utilisateur } from '@/server/domain/identité/Utilisateur';

function _toDomain(row: utilisateur): Utilisateur {
  return {
    id: row.id,
    email: row.email,
    profilId: row.profil_id,
  };
}

export class UtilisateurSQLRepository implements UtilisateurRepository {
  private readonly _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  async findOneByEmail(email: string): Promise<Utilisateur | null> {
    const row = await this._prisma.utilisateur.findUnique({ where: { email } });
    if (!row) {
      return null;
    }
    return _toDomain(row);
  }
}

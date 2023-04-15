import { Prisma, PrismaClient, utilisateur, utilisateur_chantier } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { UtilisateurRepository } from '@/server/domain/identité/UtilisateurRepository';
import { Utilisateur } from '@/server/domain/identité/Utilisateur';
import { ProfilIdByCode } from '@/server/infrastructure/accès_données/identité/seed';
import logger from '@/server/infrastructure/logger';
import UtilisateurDTO from '@/server/domain/identité/UtilisateurDTO';

function _toDomain(row: utilisateur): Utilisateur {
  return {
    id: row.id,
    email: row.email,
    nom: row.nom,
    prénom: row.prenom,
    profilId: row.profil_id,
  };
}

export class UtilisateurSQLRepository implements UtilisateurRepository {
  private readonly _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  async getByEmail(email: string): Promise<Utilisateur> {
    const result = await this.findOneByEmail(email);
    if (!result) {
      const message = `Utilisateur ${email} non trouvé.`;
      logger.error(message);
      throw new Error(message);
    }
    return result;
  }

  async findOneByEmail(email: string): Promise<Utilisateur | null> {
    const row = await this._prisma.utilisateur.findUnique({ where: { email } });
    if (!row) {
      return null;
    }
    return _toDomain(row);
  }

  async créerOuRemplaceUtilisateurs(inputUtilisateurs: UtilisateurDTO[]) {
    const resultSet = await this._prisma.profil.findMany({ select: { id: true, code: true } });
    const profilIdByCode: ProfilIdByCode = {};
    for (const profilRow of resultSet) {
      profilIdByCode[profilRow.code] = profilRow.id;
    }

    const donnéesUtilisateurs: (UtilisateurDTO & { id: string })[] = [];
    for (const input of inputUtilisateurs) {
      donnéesUtilisateurs.push({ id: uuidv4(), ...input });
    }
    const utilisateurRows: utilisateur[] = donnéesUtilisateurs.map(it => {
      return {
        id: it.id,
        email: it.email,
        nom: it.nom,
        prenom: it.prénom,
        profil_id: profilIdByCode[it.profilCode] };
    });
    const utilisateurChantierRows: utilisateur_chantier[] = [];
    for (const { id: utilisateur_id, chantierIds } of donnéesUtilisateurs) {
      for (const chantier_id of chantierIds) {
        utilisateurChantierRows.push({ utilisateur_id, chantier_id });
      }
    }

    const emails = utilisateurRows.map(it => it.email);
    await this._prisma.$transaction([
      this._prisma.$executeRaw`
        delete
        from utilisateur_chantier uc using utilisateur u
        where u.id = uc.utilisateur_id
          and u.email in (${Prisma.join(emails)}) `,
      this._prisma.utilisateur.deleteMany({ where: { email: { in : emails } } }),
      this._prisma.utilisateur.createMany({ data: utilisateurRows }),
      this._prisma.utilisateur_chantier.createMany({ data: utilisateurChantierRows }),
    ]);
  }
}

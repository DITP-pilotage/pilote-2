import { chantier, PrismaClient } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Permissions, { permissionsChantierIds } from '@/server/domain/identité/Permissions';
import { objectEntries } from '@/client/utils/objects/objects';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

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

  async getListe(permissions: Permissions): Promise<Chantier[]> {
    const chantiers = await this.prisma.chantier.findMany({
      where: {
        NOT: { ministeres: { isEmpty: true } },
        id: { in: permissionsChantierIds(permissions) },
      },
    });
    const chantiersGroupésParId = groupBy<chantier>(chantiers, c => c.id);

    return objectEntries(chantiersGroupésParId).map(([_, c]) => parseChantier(c));
  }

  async récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null> {
    const chantierRow: chantier | null = await this.prisma.chantier.findFirst({
      where: {
        id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
    });

    if (!chantierRow) {
      throw new ErreurChantierNonTrouvé(chantierId);
    }

    // TODO: avoir une réflexion sur avoir un mapper et retourné un objet du domainz Chantier
    return chantierRow.meteo as Météo | null;
  }
}

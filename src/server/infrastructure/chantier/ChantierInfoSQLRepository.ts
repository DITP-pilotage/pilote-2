import { chantier, PrismaClient } from '@prisma/client';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';

function mapToDomain(chantierPrisma: chantier): ChantierInfo {
  return {
    id: chantierPrisma.id,
    nom: chantierPrisma.nom,
    périmètreIds: chantierPrisma.perimetre_ids,
    météo: null,
    mailles: {
      nationale: {
        FR: {
          codeInsee: chantierPrisma.code_insee,
          avancement: { annuel: null, global: chantierPrisma.taux_avancement },
        },
      },
      régionale: {},
      départementale: {},
    },
  };
}

export default class ChantierInfoSQLRepository implements ChantierInfoRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe() {
    const allChantiersPrisma = await this.prisma.chantier.findMany();
    return allChantiersPrisma.filter(c => c.maille === 'NAT').map(chantierPrisma => mapToDomain(chantierPrisma));
  }
}

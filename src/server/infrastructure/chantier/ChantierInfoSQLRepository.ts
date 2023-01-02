import { chantier, PrismaClient } from '@prisma/client';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';

function mapToDomain(chantierPrisma: chantier): ChantierInfo {
  return {
    id: chantierPrisma.id,
    nom: chantierPrisma.nom,
    périmètreIds: chantierPrisma.perimetre_ids,
    météo: null,
    avancement: { annuel: null, global: null },
  };
}

export default class ChantierInfoSQLRepository implements ChantierInfoRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListeMailleNationale() {
    const chantiersPrisma = await this.prisma.chantier.findMany({
      where: { zone_nom: 'National' },
    });
    return chantiersPrisma.map(chantierPrisma => mapToDomain(chantierPrisma));
  }
}

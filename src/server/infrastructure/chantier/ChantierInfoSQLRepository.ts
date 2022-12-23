import { chantier, PrismaClient } from '@prisma/client';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';

function mapToDomain(chantierPrisma: chantier): ChantierInfo {
  return {
    id: chantierPrisma.id,
    nom: chantierPrisma.nom,
    id_périmètre: chantierPrisma.id_perimetre,
    météo: null,
    avancement: { annuel: null, global: null },
  };
}

export default class ChantierInfoSQLRepository implements ChantierInfoRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe() {
    const chantiersPrisma = await this.prisma.chantier.findMany();
    return chantiersPrisma.map(chantierPrisma => mapToDomain(chantierPrisma));
  }
}

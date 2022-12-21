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

function mapToPrisma(chantierDomaine: ChantierInfo): chantier {
  return {
    id: chantierDomaine.id,
    nom: chantierDomaine.nom,
    id_perimetre: chantierDomaine.id_périmètre,
  };
}

export default class ChantierInfoSQLRepository implements ChantierInfoRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(chantierToAdd: ChantierInfo) {
    await this.prisma.chantier.create({
      data: mapToPrisma(chantierToAdd),
    });
  }

  async getListe() {
    const chantiersPrisma = await this.prisma.chantier.findMany();
    return chantiersPrisma.map(chantierPrisma => mapToDomain(chantierPrisma));
  }
}

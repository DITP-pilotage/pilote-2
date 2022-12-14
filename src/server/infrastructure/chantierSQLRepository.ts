import { chantier, PrismaClient } from '@prisma/client';
import Chantier from '@/server/domain/chantier/chantier.interface';
import { ChantierRepository } from '@/server/domain/chantier/chantierRepository.interface';

export class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(chantierToAdd: Chantier) {
    await this.prisma.chantier.create({
      data: this.mapToPrisma(chantierToAdd),
    });
  }

  async getListeChantiers() {
    const chantiersPrisma = await this.prisma.chantier.findMany();
    return chantiersPrisma.map(chantierPrisma => this.mapToDomain(chantierPrisma));
  }

  private mapToDomain(chantierPrisma: chantier): Chantier {
    return {
      id: chantierPrisma.id,
      nom: chantierPrisma.nom,
      id_périmètre: chantierPrisma.id_perimetre,
      météo: null,
      avancement: { annuel: null, global: null },
    };
  }

  private mapToPrisma(chantierDomaine: Chantier): chantier {
    return {
      id: chantierDomaine.id,
      nom: chantierDomaine.nom,
      id_perimetre: chantierDomaine.id_périmètre,
    };
  }
}

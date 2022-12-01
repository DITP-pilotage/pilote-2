import { chantier, PrismaClient } from '@prisma/client';
import { Chantier } from 'server/domain/chantier/chantier.interface';
import { ChantierRepository } from '../domain/chantier/chantierRepository.interface';

export class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(chantierToAdd: Chantier) {
    await this.prisma.chantier.create({
      data: chantierToAdd,
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
      id_perimetre: chantierPrisma.id_perimetre,
    };
  }
}

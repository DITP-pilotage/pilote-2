import { chantier_prioritaire, PrismaClient } from '@prisma/client';
import { Chantier } from 'server/domain/chantier/chantier.interface';
import { ChantierRepository } from '../domain/chantier/chantierRepository.interface';

export class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(chantier: Chantier) {
    await this.prisma.chantier_prioritaire.create({
      data: chantier,
    });
  }

  async getListeChantiers() {
    const chantiersPrisma = await this.prisma.chantier_prioritaire.findMany();
    return chantiersPrisma.map(chantierPrisma => this.mapToDomain(chantierPrisma));
  }

  private mapToDomain(chantierPrisma: chantier_prioritaire): Chantier {
    return {
      id: chantierPrisma.id,
      nom: chantierPrisma.nom,
      axe: chantierPrisma.axe,
      ppg: chantierPrisma.ppg,
      porteur: chantierPrisma.porteur,
    };
  }
}

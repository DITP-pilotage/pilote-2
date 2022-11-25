import { chantier_prioritaire, PrismaClient } from '@prisma/client';

type Id = string;

export interface Chantier {
  id: Id;
  nom: string;
  axe: string | null;
  ppg: string | null;
  porteur: string | null;
}

export interface ChantierRepository {
  getById(id: Id): Promise<Chantier>;
  add(chantier: Chantier): Promise<any>;
}

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

  async getById(id: Id): Promise<Chantier> {
    const chantierPrisma = await this.prisma.chantier_prioritaire.findUnique({
      where: { id },
    });

    if (chantierPrisma === null)
      throw new Error('TODO');

    return this.mapToDomain(chantierPrisma);
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

import { PrismaClient } from '@prisma/client'

type Id = string;

export interface Chantier {
  id: Id;
  nom: string;
  axe: string;
  ppg: string;
  porteur: string;
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

  getById(id: Id): Promise<Chantier> {
    return this.prisma.chantier_prioritaire.findUnique({
      where: { id },
    });
  }
}

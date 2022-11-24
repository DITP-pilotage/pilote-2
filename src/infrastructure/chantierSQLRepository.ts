import { PrismaClient } from '@prisma/client'

type Id = string;

export interface Chantier {
  id: Id;
  porteur: string;
}

export interface ChantierRepository {
  getById(id: Id): Promise<Chantier>;
}

export class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  getById(id: Id): Promise<Chantier> {
    return this.prisma.chantier_prioritaire.findUnique({
      where: { id },
    });
  }
}

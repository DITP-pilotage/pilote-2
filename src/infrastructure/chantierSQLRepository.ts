import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Id = string;

export interface Chantier {
  id: Id;
  porteur: string;
}

export interface ChantierRepository {
  getById(id: Id): Promise<Chantier>;
}

export class ChantierSQLRepository implements ChantierRepository {
  getById(id: Id): Promise<Chantier> {
    return prisma.chantier_prioritaire.findUnique({
      where: { id },
    });
  }
}

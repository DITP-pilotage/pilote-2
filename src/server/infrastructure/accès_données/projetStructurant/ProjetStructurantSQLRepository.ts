import { projet_structurant as ProjetStructurantPrisma, PrismaClient } from '@prisma/client';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';

class ErreurProjetStructurantNonTrouvé extends Error {
  constructor(id: string) {
    super(`Erreur: projet structurant '${id}' non trouvé.`);
  }
}

export default class ProjetStructurantSQLRepository implements ProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async récupérer(id: string): Promise<ProjetStructurantPrisma> {
    const projetStructurant = await this.prisma.projet_structurant.findFirst({
      where: { id  },
    });

    if (!projetStructurant) throw new ErreurProjetStructurantNonTrouvé(id);

    return projetStructurant;
  }

  async récupérerListe(): Promise<ProjetStructurantPrisma[]> {
    return this.prisma.projet_structurant.findMany();    
  }
}

import { PrismaClient, decisions_strategiques as DécisionsStratégiquesPrisma } from '@prisma/client';
import DécisionsStratégiques from '@/server/domain/décisionsStratégiques/DécisionsStratégiques.interface';
import DécisionsStratégiquesRepository from '@/server/domain/décisionsStratégiques/DécisionsStratégiquesRepository.interface';

export default class DécisionsStratégiquesSQLRepository implements DécisionsStratégiquesRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  private mapperVersDomaine(décisionsStratégiques: DécisionsStratégiquesPrisma): DécisionsStratégiques {
    return {
      id: décisionsStratégiques.id,
      type: décisionsStratégiques.type,
      contenu: décisionsStratégiques.contenu,
      date: décisionsStratégiques.date.toISOString(),
      auteur: décisionsStratégiques.auteur,
    };
  }
  
  async récupérerLePlusRécent(chantierId: string): Promise<DécisionsStratégiques> {
    const décisionsStratégiquesLePlusRécent = await this.prisma.decisions_strategiques.findFirst({
      where: {
        chantier_id: chantierId,
      },
      orderBy: { date: 'desc' },
    });
  
    return décisionsStratégiquesLePlusRécent ? this.mapperVersDomaine(décisionsStratégiquesLePlusRécent) : null;
  }
}

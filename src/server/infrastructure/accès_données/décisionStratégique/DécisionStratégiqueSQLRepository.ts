import { PrismaClient, decision_strategique as DécisionStratégiquePrisma } from '@prisma/client';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';
import DécisionStratégiqueRepository from '@/server/domain/décisionStratégique/DécisionStratégiqueRepository.interface';

export default class DécisionStratégiqueSQLRepository implements DécisionStratégiqueRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  private mapperVersDomaine(décisionStratégique: DécisionStratégiquePrisma): DécisionStratégique {
    return {
      id: décisionStratégique.id,
      type: décisionStratégique.type,
      contenu: décisionStratégique.contenu,
      date: décisionStratégique.date.toISOString(),
      auteur: décisionStratégique.auteur,
    };
  }
  
  async récupérerLePlusRécent(chantierId: string): Promise<DécisionStratégique> {
    const décisionStratégiqueLaPlusRécente = await this.prisma.decision_strategique.findFirst({
      where: {
        chantier_id: chantierId,
      },
      orderBy: { date: 'desc' },
    });
  
    return décisionStratégiqueLaPlusRécente ? this.mapperVersDomaine(décisionStratégiqueLaPlusRécente) : null;
  }


  async créer(chantierId: string, id: string, contenu: string, type: DécisionStratégique['type'], auteur: string, date: Date): Promise<DécisionStratégique> {
    const décisionStratégiqueCrée =  await this.prisma.decision_strategique.create({
      data: {
        id,
        chantier_id: chantierId,
        contenu,
        type,
        date,
        auteur,
      } });

    return this.mapperVersDomaine(décisionStratégiqueCrée);
  }
}

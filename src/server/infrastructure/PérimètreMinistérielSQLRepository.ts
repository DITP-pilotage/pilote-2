import { perimetre, PrismaClient } from '@prisma/client';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';

export default class PérimètreMinistérielSQLRepository implements PérimètreMinistérielRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(chantierToAdd: PérimètreMinistériel) {
    await this.prisma.perimetre.create({
      data: this.mapToPrisma(chantierToAdd),
    });
  }

  async getListe() {
    const périmètresPrisma = await this.prisma.perimetre.findMany();
    return périmètresPrisma.map(périmètrePrisma => this.mapToDomain(périmètrePrisma));
  }

  private mapToDomain(périmètrePrisma: perimetre): PérimètreMinistériel {
    return {
      id: périmètrePrisma.id,
      nom: périmètrePrisma.nom,
    };
  }

  private mapToPrisma(périmètreDomaine: PérimètreMinistériel): perimetre {
    return {
      id: périmètreDomaine.id,
      nom: périmètreDomaine.nom,
    };
  }
}

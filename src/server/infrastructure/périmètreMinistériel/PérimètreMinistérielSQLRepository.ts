import { perimetre, PrismaClient } from '@prisma/client';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';

function mapToDomain(périmètrePrisma: perimetre): PérimètreMinistériel {
  return {
    id: périmètrePrisma.id,
    nom: périmètrePrisma.nom,
  };
}

function mapToPrisma(périmètreDomaine: PérimètreMinistériel): perimetre {
  return {
    id: périmètreDomaine.id,
    nom: périmètreDomaine.nom,
  };
}

export default class PérimètreMinistérielSQLRepository implements PérimètreMinistérielRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(chantierToAdd: PérimètreMinistériel) {
    await this.prisma.perimetre.create({
      data: mapToPrisma(chantierToAdd),
    });
  }

  async getListe() {
    const périmètresPrisma = await this.prisma.perimetre.findMany();
    return périmètresPrisma.map(périmètrePrisma => mapToDomain(périmètrePrisma));
  }
}

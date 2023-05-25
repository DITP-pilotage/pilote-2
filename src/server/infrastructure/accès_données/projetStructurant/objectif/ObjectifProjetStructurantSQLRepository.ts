import { PrismaClient, objectif_projet_structurant as ObjectifProjetStructurantPrisma } from '@prisma/client';
import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import ObjectifProjetStructurant, { TypeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';

export default class ObjectifProjetStructurantSQLRepository implements ObjectifProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(objectif: ObjectifProjetStructurantPrisma | null): ObjectifProjetStructurant {
    if (objectif === null) return null;
    return {
      id: objectif.id,
      type: objectif.type as TypeObjectifProjetStructurant,
      contenu: objectif.contenu,
      date: objectif.date.toISOString(),
      auteur: objectif.auteur ?? '',
    };
  }

  async récupérerLePlusRécent(projetStructurantId: ProjetStructurant['id']): Promise<ObjectifProjetStructurant> {
    const objectifLePlusRécent = await this.prisma.objectif_projet_structurant.findFirst({
      where: {
        projet_structurant_id: projetStructurantId,
      },
      orderBy: { date: 'desc' },
    });

    return this.mapperVersDomaine(objectifLePlusRécent);
  }
}

import { PrismaClient, objectif_projet_structurant as ObjectifProjetStructurantPrisma, type_objectif_projet_structurant as TypeObjectifProjetStructurantPrisma } from '@prisma/client';
import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import ObjectifProjetStructurant, { TypeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';

export const NOMS_TYPES_OBJECTIFS: Record<TypeObjectifProjetStructurantPrisma, TypeObjectifProjetStructurant> = {
  suivi_des_objectifs: 'SuiviDesObjectifs',
};

export const CODES_TYPES_OBJECTIFS: Record<TypeObjectifProjetStructurant, TypeObjectifProjetStructurantPrisma> = {
  SuiviDesObjectifs: 'suivi_des_objectifs',
};

export default class ObjectifProjetStructurantSQLRepository implements ObjectifProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(objectif: ObjectifProjetStructurantPrisma | null): ObjectifProjetStructurant {
    if (objectif === null) return null;
    return {
      id: objectif.id,
      type: NOMS_TYPES_OBJECTIFS[objectif.type],
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

  async créer(projetStructurantId: string, id: string, contenu: string, auteur: string, type: TypeObjectifProjetStructurant, date: Date): Promise<ObjectifProjetStructurant> {
    const objectifCréé =  await this.prisma.objectif_projet_structurant.create({
      data: {
        id: id,
        projet_structurant_id: projetStructurantId,
        contenu: contenu,
        type: CODES_TYPES_OBJECTIFS[type],
        date: date,
        auteur: auteur,
      } });

    return this.mapperVersDomaine(objectifCréé);
  }

  async récupérerHistorique(projetStructurantId: string, type: TypeObjectifProjetStructurant): Promise<ObjectifProjetStructurant[]> {
    const objectifs: ObjectifProjetStructurantPrisma[] = await this.prisma.objectif_projet_structurant.findMany({
      where: {
        projet_structurant_id: projetStructurantId,
        type: CODES_TYPES_OBJECTIFS[type],
      },
      orderBy: { date: 'desc' },
    });

    return objectifs.map(objectifDeLHistorique => this.mapperVersDomaine(objectifDeLHistorique));
  }

}

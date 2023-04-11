import { PrismaClient, objectif as ObjectifPrisma, type_objectif as TypeObjectifPrisma } from '@prisma/client';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import Objectif, { TypeObjectif } from '@/server/domain/objectif/Objectif.interface';

export const NOMS_TYPES_OBJECTIFS: Record<TypeObjectifPrisma, TypeObjectif> = {
  notre_ambition: 'notreAmbition',
  deja_fait: 'déjàFait',
  a_faire: 'àFaire',
};

export const CODES_TYPES_OBJECTIFS: Record<TypeObjectif, TypeObjectifPrisma> = {
  notreAmbition: 'notre_ambition',
  déjàFait: 'deja_fait',
  àFaire: 'a_faire',
};

export default class ObjectifSQLRepository implements ObjectifRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(objectif: ObjectifPrisma): Objectif {
    return {
      contenu: objectif.contenu,
      date: objectif.date.toISOString(),
      auteur: objectif.auteur,
    };
  }

  async récupérerLePlusRécent(chantierId: string, type: TypeObjectif): Promise<Objectif> {
    const objectifLePlusRécent = await this.prisma.objectif.findFirst({
      where: {
        chantier_id: chantierId,
        type: CODES_TYPES_OBJECTIFS[type],
      },
      orderBy: { date: 'desc' },
    });

    return objectifLePlusRécent ? this.mapperVersDomaine(objectifLePlusRécent) : null;
  }

  async récupérerHistoriqueDUnObjectif(chantierId: string, type: TypeObjectif): Promise<Objectif[]> {
    const objectifs: ObjectifPrisma[] = await this.prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
        type: CODES_TYPES_OBJECTIFS[type],
      },
      orderBy: { date: 'desc' },
    });

    return objectifs.map(objectifDeLHistorique => this.mapperVersDomaine(objectifDeLHistorique));
  }

  async créer(chantierId: string, id: string, contenu: string, auteur: string, type: TypeObjectif, date: Date): Promise<Objectif> {
    const objectifCréé =  await this.prisma.objectif.create({
      data: {
        id: id,
        chantier_id: chantierId,
        contenu: contenu,
        type: CODES_TYPES_OBJECTIFS[type],
        date: date,
        auteur: auteur,
      } });

    return this.mapperVersDomaine(objectifCréé);
  }
}

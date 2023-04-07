import { PrismaClient, objectif as ObjectifPrisma } from '@prisma/client';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import Objectif, { Objectifs, TypeObjectif } from '@/server/domain/objectif/Objectif.interface';

export const NOMS_TYPES_OBJECTIFS: Record<string, TypeObjectif> = {
  notre_ambition: 'notreAmbition',
  deja_fait: 'déjàFait',
  a_faire: 'àFaire',
};

export const CODES_TYPES_OBJECTIFS: Record<TypeObjectif, string> = {
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
      auteur: '',
    };
  }

  private récupérerPremierObjectifPourUnTypeDonné(objectifs: ObjectifPrisma[], typeObjectif: string): Objectif | null {
    const objectifsParType = objectifs.filter((objectif) => objectif.type == typeObjectif);
    if (objectifsParType.length === 0) {
      return null;
    }
    return this.mapperVersDomaine(objectifsParType[0]);
  }
  
  async récupérerLePlusRécentPourChaqueType(chantierId: string): Promise<Objectifs> {
    const objectifs = await this.prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
        type: { in: ['notre_ambition', 'deja_fait', 'a_faire'] },
      },
      orderBy: { date: 'desc' },
    });

    return {
      notreAmbition: this.récupérerPremierObjectifPourUnTypeDonné(objectifs, 'notre_ambition'),
      déjàFait: this.récupérerPremierObjectifPourUnTypeDonné(objectifs, 'deja_fait'),
      àFaire: this.récupérerPremierObjectifPourUnTypeDonné(objectifs, 'a_faire'),
    };
  }

  async récupérerHistoriqueDUnObjectif(chantierId: string): Promise<Objectif[]> {
    const objectifs: ObjectifPrisma[] = await this.prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
      },
      orderBy: { date: 'desc' },
    });

    return objectifs.map(objectifDeLHistorique => this.mapperVersDomaine(objectifDeLHistorique));
  }
}

import { PrismaClient, objectif as ObjectifPrisma, type_objectif as TypeObjectifPrisma } from '@prisma/client';
import ObjectifRepository from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import Objectif, { TypeObjectifChantier } from '@/server/domain/chantier/objectif/Objectif.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { groupByAndTransform } from '@/client/utils/arrays';

export const NOMS_TYPES_OBJECTIFS: Record<TypeObjectifPrisma, TypeObjectifChantier> = {
  notre_ambition: 'notreAmbition',
  deja_fait: 'déjàFait',
  a_faire: 'àFaire',
};

export const CODES_TYPES_OBJECTIFS: Record<TypeObjectifChantier, TypeObjectifPrisma> = {
  notreAmbition: 'notre_ambition',
  déjàFait: 'deja_fait',
  àFaire: 'a_faire',
};

export default class ObjectifSQLRepository implements ObjectifRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(objectif: ObjectifPrisma | null): Objectif {
    if (objectif === null) return null;
    return {
      id: objectif.id,
      type: NOMS_TYPES_OBJECTIFS[objectif.type],
      contenu: objectif.contenu,
      date: objectif.date.toISOString(),
      auteur: objectif.auteur,
    };
  }

  async récupérerLePlusRécent(chantierId: string, type: TypeObjectifChantier): Promise<Objectif> {
    const objectifLePlusRécent = await this.prisma.objectif.findFirst({
      where: {
        chantier_id: chantierId,
        type: CODES_TYPES_OBJECTIFS[type],
      },
      orderBy: { date: 'desc' },
    });

    return this.mapperVersDomaine(objectifLePlusRécent);
  }

  async récupérerHistorique(chantierId: string, type: TypeObjectifChantier): Promise<Objectif[]> {
    const objectifs: ObjectifPrisma[] = await this.prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
        type: CODES_TYPES_OBJECTIFS[type],
      },
      orderBy: { date: 'desc' },
    });

    return objectifs.map(objectifDeLHistorique => this.mapperVersDomaine(objectifDeLHistorique));
  }

  async créer(chantierId: string, id: string, contenu: string, auteur: string, type: TypeObjectifChantier, date: Date): Promise<Objectif> {
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

  async récupérerLesPlusRécentsGroupésParChantier(chantiersIds: Chantier['id'][]) {
    const objectifs = await this.prisma.$queryRaw<ObjectifPrisma[]>`
      SELECT o.*
      FROM objectif o
        INNER JOIN (
          SELECT type, chantier_id, MAX(date) as maxdate
          FROM objectif
          WHERE  chantier_id = ANY (${chantiersIds})
          GROUP BY type, chantier_id
        ) o_recents
          ON o.type = o_recents.type
            AND o.date = o_recents.maxdate
            AND o.chantier_id = o_recents.chantier_id
    `;

    return groupByAndTransform(
      objectifs,
      o => o.chantier_id,
      (o: ObjectifPrisma) => this.mapperVersDomaine(o),
    );
  }
}

import { PrismaClient, objectif as ObjectifPrisma, type_objectif as TypeObjectifPrisma, utilisateur as UtilisateurPrisma } from '@prisma/client';
import ObjectifRepository from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import Objectif, { TypeObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { groupByAndTransform } from '@/client/utils/arrays';

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

  private mapperVersDomaine(objectif: ObjectifPrisma & { auteur_objectif: UtilisateurPrisma | null } | null): Objectif {
    if (objectif === null) return null;
    const auteurObjectif = objectif.auteur_objectif;
    return {
      id: objectif.id,
      type: NOMS_TYPES_OBJECTIFS[objectif.type],
      contenu: objectif.contenu,
      date: objectif.date.toISOString(),
      auteur: auteurObjectif ? `${auteurObjectif.prenom} ${auteurObjectif.nom}` : 'Auteur Inconnu',
    };
  }

  async récupérerLePlusRécent(chantierId: string, type: TypeObjectif): Promise<Objectif> {
    const objectifLePlusRécent = await this.prisma.objectif.findFirst({
      where: {
        chantier_id: chantierId,
        type: CODES_TYPES_OBJECTIFS[type],
      },
      include: {
        auteur_objectif: true,
      },
      orderBy: { date: 'desc' },
    });

    return this.mapperVersDomaine(objectifLePlusRécent);
  }

  async récupérerHistorique(chantierId: string, type: TypeObjectif): Promise<Objectif[]> {
    const objectifs = await this.prisma.objectif.findMany({
      where: {
        chantier_id: chantierId,
        type: CODES_TYPES_OBJECTIFS[type],
      },
      include: {
        auteur_objectif: true,
      },
      orderBy: { date: 'desc' },
    });

    return objectifs.map(objectifDeLHistorique => this.mapperVersDomaine(objectifDeLHistorique));
  }

  async créer(chantierId: string, id: string, contenu: string, auteur_id: string, type: TypeObjectif, date: Date): Promise<Objectif> {
    const objectifCréé =  await this.prisma.objectif.create({
      data: {
        id: id,
        chantier_id: chantierId,
        contenu: contenu,
        type: CODES_TYPES_OBJECTIFS[type],
        date: date,
        auteur_id: auteur_id,
      },
      include: {
        auteur_objectif: true,
      },
    });

    return this.mapperVersDomaine(objectifCréé);
  }

  async récupérerLesPlusRécentsGroupésParChantier(chantiersIds: Chantier['id'][]) {
    const objectifs = await this.prisma.$queryRaw<(ObjectifPrisma & { auteur_prenom: string, auteur_nom: string })[]>`
      SELECT o.*, utilisateur.prenom as auteur_prenom, utilisateur.nom as auteur_nom
      FROM objectif o
        LEFT JOIN utilisateur on utilisateur.id = o.auteur_id
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
      objectif => objectif.chantier_id,
      objectif => {
        return {
          id: objectif.id,
          type: NOMS_TYPES_OBJECTIFS[objectif.type],
          contenu: objectif.contenu,
          date: objectif.date.toISOString(),
          auteur: objectif.auteur_id ? `${objectif.auteur_prenom} ${objectif.auteur_nom}` : 'Auteur Inconnu',        
        };
      },
    );
  }
}

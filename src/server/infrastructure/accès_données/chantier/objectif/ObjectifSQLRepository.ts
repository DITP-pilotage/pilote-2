import { objectif as ObjectifPrisma, type_objectif as TypeObjectifPrisma, utilisateur as UtilisateurPrisma } from '@prisma/client';
import ObjectifRepository from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import Objectif, { TypeObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { groupByAndTransform } from '@/client/utils/arrays';
import { prisma } from '@/server/db/prisma';

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
    const objectifLePlusRécent = await prisma.objectif.findFirst({
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
    const objectifs = await prisma.objectif.findMany({
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
    const objectifCréé =  await prisma.objectif.create({
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
    const result = await prisma.objectif.groupBy({
      by: ['type', 'chantier_id'],
      where: {
        chantier_id: { in: chantiersIds },
      },
      _max: {
        date: true,
      },
    });

    const latestEntries = await Promise.all(
      result.filter(group => group._max.date).map(async (group) => (
        prisma.objectif.findFirst({
          where: {
            type: group.type,
            date: group._max.date!,
            chantier_id: group.chantier_id,
          },
          include: {
            auteur_objectif: true,
          },
        })
      )),
    ).then(resultObjectif => resultObjectif.filter(Boolean));

    return groupByAndTransform(
      latestEntries,
      objectif => objectif.chantier_id,
      objectif => {
        return {
          id: objectif.id,
          type: NOMS_TYPES_OBJECTIFS[objectif.type],
          contenu: objectif.contenu,
          date: objectif.date.toISOString(),
          auteur: objectif.auteur_objectif ? `${objectif.auteur_objectif.prenom} ${objectif.auteur_objectif.nom}` : 'Auteur Inconnu',
        };
      },
    );
  }
}

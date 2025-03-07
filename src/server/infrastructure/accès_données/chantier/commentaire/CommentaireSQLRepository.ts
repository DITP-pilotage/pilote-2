import { commentaire as CommentairePrisma, utilisateur } from '@prisma/client';
import CommentaireRepository from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import {
  Commentaire,
  TypeCommentaireChantier,
} from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { groupByAndTransform } from '@/client/utils/arrays';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { prisma } from '@/server/db/prisma';

export const NOMS_TYPES_COMMENTAIRES: Record<string, TypeCommentaireChantier> = {
  commentaires_sur_les_donnees: 'commentairesSurLesDonnées',
  autres_resultats_obtenus: 'autresRésultatsObtenus',
  autres_resultats_obtenus_non_correles_aux_indicateurs: 'autresRésultatsObtenusNonCorrélésAuxIndicateurs',
  freins_a_lever: 'risquesEtFreinsÀLever',
  actions_a_venir: 'solutionsEtActionsÀVenir',
  actions_a_valoriser: 'exemplesConcretsDeRéussite',
};

export const CODES_TYPES_COMMENTAIRES: Record<TypeCommentaireChantier, string> = {
  commentairesSurLesDonnées: 'commentaires_sur_les_donnees',
  autresRésultatsObtenus: 'autres_resultats_obtenus',
  autresRésultatsObtenusNonCorrélésAuxIndicateurs: 'autres_resultats_obtenus_non_correles_aux_indicateurs',
  risquesEtFreinsÀLever: 'freins_a_lever',
  solutionsEtActionsÀVenir: 'actions_a_venir',
  exemplesConcretsDeRéussite: 'actions_a_valoriser',
};

export default class CommentaireSQLRepository implements CommentaireRepository {
  private mapperVersDomaine(commentairePrisma: CommentairePrisma & { auteur_commentaire: utilisateur | null }): Commentaire {
    if (commentairePrisma === undefined) return null;
    const auteurCommentaire = commentairePrisma.auteur_commentaire;
    return {
      id: commentairePrisma.id,
      contenu: commentairePrisma.contenu,
      date: commentairePrisma.date.toISOString(),
      auteur: auteurCommentaire ? `${auteurCommentaire.prenom} ${auteurCommentaire.nom}` : 'Auteur Inconnu',
      type: NOMS_TYPES_COMMENTAIRES[commentairePrisma.type],
    };
  }

  async récupérerLePlusRécent(chantierId: string, territoireCode: string, type: TypeCommentaireChantier): Promise<Commentaire> {
    const commentaireLePlusRécent = await prisma.commentaire.findFirst({
      where: {
        chantier_id: chantierId,
        territoire_code: territoireCode,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      include: {
        auteur_commentaire: true,
      },
      orderBy: { date: 'desc' },
    });

    return commentaireLePlusRécent ? this.mapperVersDomaine(commentaireLePlusRécent) : null;
  }

  async récupérerHistorique(chantierId: string, territoireCode: string, type: TypeCommentaireChantier): Promise<Commentaire[]> {
    const commentaires = await prisma.commentaire.findMany({
      where: {
        chantier_id: chantierId,
        territoire_code: territoireCode,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      include: {
        auteur_commentaire: true,
      },
      orderBy: { date: 'desc' },
    });

    return commentaires.map(commentaireDeLHistorique => this.mapperVersDomaine(commentaireDeLHistorique));
  }

  async créer(chantierId: string, territoireCode: string, id: string, contenu: string, auteur_id: string, type: TypeCommentaireChantier, date: Date): Promise<Commentaire> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    const commentaireCréé =  await prisma.commentaire.create({
      data: {
        id: id,
        chantier_id: chantierId,
        maille: maille,
        code_insee: codeInsee,
        territoire_code: territoireCode,
        contenu: contenu,
        type: CODES_TYPES_COMMENTAIRES[type],
        date: date,
        auteur_id: auteur_id,
      },
      include: {
        auteur_commentaire: true,
      },
    });

    return this.mapperVersDomaine(commentaireCréé);
  }

  async récupérerLesPlusRécentsGroupésParChantier(listeChantierIds: Chantier['id'][], territoireCode: string): Promise<Record<string, Commentaire[]>> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    const commentairesAvecAuteur = await prisma.$queryRaw<(CommentairePrisma & utilisateur)[]>`
      SELECT c.chantier_id, c.contenu, c.type, c.id, c.date, utilisateur.nom, utilisateur.prenom
      FROM commentaire c
      LEFT JOIN utilisateur on utilisateur.id = c.auteur_id
      INNER JOIN (
        SELECT type, chantier_id, maille, code_insee, MAX(date) as maxdate
        FROM commentaire
        WHERE chantier_id = ANY (${listeChantierIds})
          AND maille = ${maille}
          AND code_insee = ${codeInsee}
        GROUP BY type, chantier_id, maille, code_insee
      ) c_recents
        ON c.type = c_recents.type
        AND c.date = c_recents.maxdate
        AND c.chantier_id = c_recents.chantier_id
        AND c.maille = c_recents.maille
        AND c.code_insee = c_recents.code_insee
    `;

    return groupByAndTransform(
      commentairesAvecAuteur,
      commentaireAvecAuteur => commentaireAvecAuteur.chantier_id,
      (commentaireAvecAuteur: CommentairePrisma & utilisateur) => {
        return {
          id: commentaireAvecAuteur.id,
          contenu: commentaireAvecAuteur.contenu,
          date: commentaireAvecAuteur.date.toISOString(),
          auteur: commentaireAvecAuteur.nom && commentaireAvecAuteur.prenom ? `${commentaireAvecAuteur.prenom} ${commentaireAvecAuteur.nom}` : 'Auteur Inconnu',
          type: NOMS_TYPES_COMMENTAIRES[commentaireAvecAuteur.type],
        };
      },
    );
  }
}

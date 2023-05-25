import { commentaire as CommentairePrisma, PrismaClient } from '@prisma/client';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import {
  Commentaire,
  TypeCommentaireChantier,
} from '@/server/domain/commentaire/Commentaire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { groupByAndTransform } from '@/client/utils/arrays';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';

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
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(commentairePrisma: CommentairePrisma | undefined) {
    if (commentairePrisma === undefined) return null;
    return {
      id: commentairePrisma.id,
      contenu: commentairePrisma.contenu,
      date: commentairePrisma.date.toISOString(),
      auteur: commentairePrisma.auteur,
      type: NOMS_TYPES_COMMENTAIRES[commentairePrisma.type],
    };
  }

  async récupérerLePlusRécent(chantierId: string, territoireCode: string, type: TypeCommentaireChantier): Promise<Commentaire> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    const commentaireLePlusRécent = await this.prisma.commentaire.findFirst({
      where: {
        chantier_id: chantierId,
        maille: maille,
        code_insee: codeInsee,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      orderBy: { date: 'desc' },
    });

    return commentaireLePlusRécent ? this.mapperVersDomaine(commentaireLePlusRécent) : null;
  }

  async récupérerHistorique(chantierId: string, territoireCode: string, type: TypeCommentaireChantier): Promise<Commentaire[]> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    const commentaires: CommentairePrisma[] = await this.prisma.commentaire.findMany({
      where: {
        chantier_id: chantierId,
        maille: maille,
        code_insee: codeInsee,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      orderBy: { date: 'desc' },
    });

    return commentaires.map(commentaireDeLHistorique => this.mapperVersDomaine(commentaireDeLHistorique));
  }

  async créer(chantierId: string, territoireCode: string, id: string, contenu: string, auteur: string, type: TypeCommentaireChantier, date: Date): Promise<Commentaire> {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    const commentaireCréé =  await this.prisma.commentaire.create({
      data: {
        id: id,
        chantier_id: chantierId,
        maille: maille,
        code_insee: codeInsee,
        contenu: contenu,
        type: CODES_TYPES_COMMENTAIRES[type],
        date: date,
        auteur: auteur,
      } });

    return this.mapperVersDomaine(commentaireCréé);
  }

  async récupérerLesPlusRécentsGroupésParChantier(chantiersIds: Chantier['id'][], territoireCode: string) {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    const commentaires = await this.prisma.$queryRaw<CommentairePrisma[]>`
      SELECT c.chantier_id, c.contenu, c.auteur, c.type, id, date
      FROM commentaire c
        INNER JOIN (
          SELECT type, chantier_id, maille, code_insee, MAX(date) as maxdate
          FROM commentaire
          WHERE chantier_id = ANY (${chantiersIds})
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
      commentaires,
      c => c.chantier_id,
      (c: CommentairePrisma) => this.mapperVersDomaine(c),
    );
  }
}

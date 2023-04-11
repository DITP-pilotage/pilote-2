import { commentaire, PrismaClient } from '@prisma/client';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import {
  Commentaires,
  Commentaire,
  TypeCommentaire,
} from '@/server/domain/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';

export const NOMS_TYPES_COMMENTAIRES: Record<string, TypeCommentaire> = {
  freins_a_lever: 'freinsÀLever',
  actions_a_venir: 'actionsÀVenir',
  actions_a_valoriser: 'actionsÀValoriser',
  autres_resultats_obtenus: 'autresRésultatsObtenus',
};

export const CODES_TYPES_COMMENTAIRES: Record<TypeCommentaire, string> = {
  freinsÀLever: 'freins_a_lever',
  actionsÀVenir: 'actions_a_venir',
  actionsÀValoriser: 'actions_a_valoriser',
  autresRésultatsObtenus: 'autres_resultats_obtenus',
};

export default class CommentaireSQLRepository implements CommentaireRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(commentairePrisma: commentaire) {
    return {
      id: commentairePrisma.id,
      contenu: commentairePrisma.contenu,
      date: commentairePrisma.date.toISOString(),
      auteur: commentairePrisma.auteur,
      type: NOMS_TYPES_COMMENTAIRES[commentairePrisma.type],
    };
  }

  private récupérerPremierCommentairePourUnTypeDonné(commentaires: commentaire[], typeCommentaire: string): Commentaire | null {
    const commentairesByType = commentaires.filter((comm) => comm.type == typeCommentaire);
    if (commentairesByType.length === 0) {
      return null;
    }
    return this.mapperVersDomaine(commentairesByType[0]);
  }

  async récupérerLesPlusRécentsParType(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Commentaires> {
    const commentaires: commentaire[] = await this.prisma.commentaire.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        type: { in: ['freins_a_lever', 'actions_a_venir', 'actions_a_valoriser', 'autres_resultats_obtenus'] },
      },
      orderBy: { date: 'desc' },
    });

    return {
      freinsÀLever: this.récupérerPremierCommentairePourUnTypeDonné(commentaires, 'freins_a_lever'),
      actionsÀVenir: this.récupérerPremierCommentairePourUnTypeDonné(commentaires, 'actions_a_venir'),
      actionsÀValoriser: this.récupérerPremierCommentairePourUnTypeDonné(commentaires, 'actions_a_valoriser'),
      autresRésultatsObtenus: this.récupérerPremierCommentairePourUnTypeDonné(commentaires, 'autres_resultats_obtenus'),
    };
  }

  async récupérerHistoriqueDUnCommentaire(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<Commentaire[]> {
    const commentaires: commentaire[] = await this.prisma.commentaire.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      orderBy: { date: 'desc' },
    });

    return commentaires.map(commentaireDeLHistorique => this.mapperVersDomaine(commentaireDeLHistorique));
  }

  async créer(chantierId: string, maille: Maille, codeInsee: CodeInsee, id: string, contenu: string, auteur: string, type: TypeCommentaire, date: Date): Promise<Commentaire> {
    const commentaireCréé =  await this.prisma.commentaire.create({
      data: {
        id: id,
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        contenu: contenu,
        type: CODES_TYPES_COMMENTAIRES[type],
        date: date,
        auteur: auteur,
      } });

    return this.mapperVersDomaine(commentaireCréé);
  }
}

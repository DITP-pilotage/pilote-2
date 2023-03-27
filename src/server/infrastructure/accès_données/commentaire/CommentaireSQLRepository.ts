import { commentaire, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import {
  Commentaires,
  DétailsCommentaire,
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


  private mapToDomain(commentairePrisma: commentaire) {
    return {
      contenu: commentairePrisma.contenu,
      date: commentairePrisma.date.toISOString(),
      auteur: commentairePrisma.auteur,
    };
  }

  private getPremierCommentairePourUnTypeDonné(commentaires: commentaire[], typeCommentaire: string): DétailsCommentaire | null {
    const commentairesByType = commentaires.filter((comm) => comm.type == typeCommentaire);
    if (commentairesByType.length === 0) {
      return null;
    }
    return this.mapToDomain(commentairesByType[0]);
  }


  async getDernierCommentaireParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Commentaires> {
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
      freinsÀLever: this.getPremierCommentairePourUnTypeDonné(commentaires, 'freins_a_lever'),
      actionsÀVenir: this.getPremierCommentairePourUnTypeDonné(commentaires, 'actions_a_venir'),
      actionsÀValoriser: this.getPremierCommentairePourUnTypeDonné(commentaires, 'actions_a_valoriser'),
      autresRésultatsObtenus: this.getPremierCommentairePourUnTypeDonné(commentaires, 'autres_resultats_obtenus'),
    };
  }

  async récupérerHistoriqueDUnCommentaire(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<DétailsCommentaire[]> {
    const commentaires: commentaire[] = await this.prisma.commentaire.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      orderBy: { date: 'desc' },
    });

    return commentaires.map(commentaireDeLHistorique => this.mapToDomain(commentaireDeLHistorique));
  }

  async getObjectifsByChantierId(chantierId: string): Promise<DétailsCommentaire | null> {
    const commentaireObjectifs: commentaire | null = await this.prisma.commentaire.findFirst({
      where: {
        chantier_id: chantierId,
        type: 'objectifs',
      },
      orderBy: { date: 'desc' },
    });

    if (!commentaireObjectifs) {
      return null;
    }

    return this.mapToDomain(commentaireObjectifs);
  }

  async créerNouveauCommentaire(chantierId: string, typeDeCommentaire: TypeCommentaire, maille: Maille, codeInsee: CodeInsee, détailsCommentaire: DétailsCommentaire) {
    const commentaireRow = {
      id: faker.helpers.unique(faker.datatype.number),
      chantier_id: chantierId,
      type: CODES_TYPES_COMMENTAIRES[typeDeCommentaire],
      contenu: détailsCommentaire.contenu,
      date: détailsCommentaire.date,
      auteur: détailsCommentaire.auteur,
      maille: CODES_MAILLES[maille],
      code_insee: codeInsee,
    };

    await this.prisma.commentaire.create({
      data: commentaireRow,
    });

    return {
      contenu: commentaireRow.contenu,
      date: commentaireRow.date,
      auteur: commentaireRow.auteur,
    };
  }
}

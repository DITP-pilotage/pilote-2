import { commentaire, PrismaClient } from '@prisma/client';
import CommentaireRepository from '@/server/domain/chantier/CommentaireRepository.interface';
import {
  Commentaires,
  DetailsCommentaire,
  TypeCommentaire,
} from '@/server/domain/chantier/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

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

//TODO: factoriser la méthode car apparaît à 3 endroits dans le code
function dateToDateStringWithoutTime(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default class CommentaireSQLRepository implements CommentaireRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }


  private getFirstCommentaireForAGivenType(commentaires: commentaire[], typeCommentaire: string): DetailsCommentaire | null {
    const commentaireByType = commentaires.filter((comm) => comm.type == typeCommentaire);
    if (commentaireByType.length === 0) {
      return null;
    }
    return {
      contenu: commentaireByType[0].contenu,
      date: dateToDateStringWithoutTime(commentaireByType[0].date),
      auteur: commentaireByType[0].auteur,
    };
  }


  async findNewestByChantierIdAndTerritoire(chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<Commentaires> {
    const commentaires: commentaire[] = await this.prisma.commentaire.findMany({
      where: {
        chantier_id: chantierId,
        maille: 'NAT',
        code_insee: 'FR',
        type: { in: ['freins_a_lever', 'actions_a_venir', 'actions_a_valoriser', 'autres_resultats_obtenus'] },
      },
      orderBy: { date : 'desc' },
    });

    return {
      freinsÀLever: this.getFirstCommentaireForAGivenType(commentaires, 'freins_a_lever'),
      actionsÀVenir: this.getFirstCommentaireForAGivenType(commentaires, 'actions_a_venir'),
      actionsÀValoriser: this.getFirstCommentaireForAGivenType(commentaires, 'actions_a_valoriser'),
      autresRésultatsObtenus: this.getFirstCommentaireForAGivenType(commentaires, 'autres_resultats_obtenus'),
    };
  }
}

import { commentaire as CommentaireModel, PrismaClient } from '@prisma/client';
import { Commentaire } from '@/server/fiche-conducteur/domain/Commentaire';
import { CommentaireRepository } from '@/server/fiche-conducteur/domain/ports/CommentaireRepository';
import { CommentaireType } from '@/server/fiche-conducteur/domain/CommentaireType';

const convertifEnCommentaire = (commentaireModel: CommentaireModel): Commentaire => (Commentaire.creerCommentaire({
  type: commentaireModel.type as CommentaireType,
  contenu: commentaireModel.contenu,
  date: commentaireModel.date.toISOString(),
})
);

export class PrismaCommentaireRepository implements CommentaireRepository {

  constructor(private prismaClient: PrismaClient) {}

  async listerCommentaireParChantierId({ chantierId }: { chantierId: string }): Promise<Commentaire[]> {
    const commentaireResult = await this.prismaClient.commentaire.findMany({
      where: {
        chantier_id: chantierId,
      },
    });

    return commentaireResult.map(convertifEnCommentaire);
  }
}

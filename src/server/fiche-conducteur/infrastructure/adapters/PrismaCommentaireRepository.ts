import { commentaire as CommentaireModel } from "@prisma/client";
import { Commentaire } from "@/server/fiche-conducteur/domain/Commentaire";
import { CommentaireRepository } from "@/server/fiche-conducteur/domain/ports/CommentaireRepository";
import { CommentaireType } from "@/server/fiche-conducteur/domain/CommentaireType";
import { PrismaPilote } from "@/server/db/PrismaPilote";

const convertifEnCommentaire = (
  commentaireModel: CommentaireModel,
): Commentaire =>
  Commentaire.creerCommentaire({
    type: commentaireModel.type as CommentaireType,
    contenu: commentaireModel.contenu,
    date: commentaireModel.date_modification.toISOString(),
  });

export class PrismaCommentaireRepository implements CommentaireRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }

  async listerCommentaireParChantierId({
    chantierId,
  }: {
    chantierId: string;
  }): Promise<Commentaire[]> {
    const commentaireResult = await this.prisma.commentaire.findMany({
      where: {
        chantier_id: chantierId,
      },
    });

    return commentaireResult.map(convertifEnCommentaire);
  }
}

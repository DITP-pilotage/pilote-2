import { commentaire as CommentaireModel } from "@prisma/client";
import { Commentaire } from "@/server/fiche-conducteur/domain/Commentaire";
import { CommentaireRepository } from "@/server/fiche-conducteur/domain/ports/CommentaireRepository";
import { CommentaireType } from "@/server/fiche-conducteur/domain/CommentaireType";

import { PrismaPilote } from "@/server/db/PrismaPilote";

import { PilotePrismaClient } from "@/server/db/PrismaTransaction";

const convertifEnCommentaire = (
  commentaireModel: CommentaireModel,
): Commentaire =>
  Commentaire.creerCommentaire({
    type: commentaireModel.type as CommentaireType,
    contenu: commentaireModel.contenu,
    date: commentaireModel.date.toISOString(),
  });

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaCommentaireRepository implements CommentaireRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
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

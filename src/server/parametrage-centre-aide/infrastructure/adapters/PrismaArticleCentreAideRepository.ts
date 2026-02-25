import { article_centre_aide as ArticleCentreAideModel } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { PilotePrismaClient } from "@/server/db/PrismaTransaction";

const convertirEnModel = (
  article: ArticleCentreAide,
): ArticleCentreAideModel => {
  return {
    id: article.id,
    titre: article.titre,
    contenu: article.contenu,
    type: article.type,
    ordre: article.ordre,
    parent_id: article.parentId,
    date_creation: article.dateCreation,
    date_modification: article.dateModification,
  };
};

const convertirEnDomaine = (
  model: ArticleCentreAideModel,
): ArticleCentreAide => {
  return ArticleCentreAide.creerArticle({
    id: model.id,
    titre: model.titre,
    contenu: model.contenu,
    type: model.type,
    ordre: model.ordre,
    parentId: model.parent_id,
    dateCreation: model.date_creation,
    dateModification: model.date_modification,
  });
};

export class PrismaArticleCentreAideRepository implements ArticleCentreAideRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async creer(article: ArticleCentreAide): Promise<void> {
    const model = convertirEnModel(article);
    await this.prisma.article_centre_aide.create({ data: model });
  }

  async lister(): Promise<ArticleCentreAide[]> {
    const articles = await this.prisma.article_centre_aide.findMany({
      orderBy: { ordre: "asc" },
    });
    return articles.map(convertirEnDomaine);
  }

  async modifier(article: ArticleCentreAide): Promise<void> {
    const model = convertirEnModel(article);
    await this.prisma.article_centre_aide.update({
      where: { id: article.id },
      data: model,
    });
  }

  async supprimer(id: string): Promise<void> {
    await this.prisma.article_centre_aide.delete({
      where: { id },
    });
  }
}

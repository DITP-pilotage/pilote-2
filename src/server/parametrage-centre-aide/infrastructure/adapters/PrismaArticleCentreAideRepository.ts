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
    titre_brouillon: article.titreBrouillon,
    contenu_brouillon: article.contenuBrouillon,
    titre_affiche: article.titreAffiche,
    titre_affiche_brouillon: article.titreAfficheBrouillon,
    type: article.type,
    ordre: article.ordre,
    parent_id: article.parentId,
    est_publie: article.estPublie,
    est_masque: article.estMasque,
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
    titreBrouillon: model.titre_brouillon,
    contenuBrouillon: model.contenu_brouillon,
    titreAffiche: model.titre_affiche,
    titreAfficheBrouillon: model.titre_affiche_brouillon,
    type: model.type,
    ordre: model.ordre,
    parentId: model.parent_id,
    estPublie: model.est_publie,
    estMasque: model.est_masque,
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

  async recupererParId(id: string): Promise<ArticleCentreAide | null> {
    const article = await this.prisma.article_centre_aide.findUnique({
      where: { id },
    });
    return article ? convertirEnDomaine(article) : null;
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

  async listerParParent(parentId: string | null): Promise<ArticleCentreAide[]> {
    const articles = await this.prisma.article_centre_aide.findMany({
      where: { parent_id: parentId },
      orderBy: { ordre: "asc" },
    });
    return articles.map(convertirEnDomaine);
  }

  async modifierOrdreEtParent(
    id: string,
    ordre: number,
    parentId: string | null,
  ): Promise<void> {
    await this.prisma.article_centre_aide.update({
      where: { id },
      data: { ordre, parent_id: parentId },
    });
  }
}

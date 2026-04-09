import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { Transaction } from "@/server/db/Transaction";
import type { Inject } from "@/server/parametrage-centre-aide/module";

type ActionDeplacement = "monter" | "descendre" | "sortir" | "entrer";

export class DeplacerArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  private transaction: Transaction;

  constructor({
    articleCentreAideRepository,
    transaction,
  }: Inject<"articleCentreAideRepository" | "transaction">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
    this.transaction = transaction;
  }

  async execute({ id, action }: { id: string; action: ActionDeplacement }) {
    const article = await this.articleCentreAideRepository.recupererParId(id);
    if (!article) throw new Error("Article introuvable");

    const freres = await this.articleCentreAideRepository.listerParParent(
      article.parentId,
    );
    const index = freres.findIndex((frere) => frere.id === id);
    if (index === -1) {
      throw new Error("Article introuvable parmi les éléments du même parent");
    }

    if (action === "monter") {
      if (index <= 0) return;
      const precedent = freres[index - 1];
      await this.transaction.run(async () => {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          id,
          precedent.ordre,
          article.parentId,
        );
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          precedent.id,
          article.ordre,
          precedent.parentId,
        );
      });
    }

    if (action === "descendre") {
      if (index >= freres.length - 1) return;
      const suivant = freres[index + 1];
      await this.transaction.run(async () => {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          id,
          suivant.ordre,
          article.parentId,
        );
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          suivant.id,
          article.ordre,
          suivant.parentId,
        );
      });
    }

    if (action === "sortir") {
      if (!article.parentId) return;
      const parent = await this.articleCentreAideRepository.recupererParId(
        article.parentId,
      );
      if (!parent) return;

      const freresParent =
        await this.articleCentreAideRepository.listerParParent(parent.parentId);
      const indexParent = freresParent.findIndex(
        (frere) => frere.id === parent.id,
      );
      if (indexParent === -1) {
        throw new Error("Parent introuvable parmi les éléments du même niveau");
      }
      const nouvelOrdre = indexParent + 1;

      await this.transaction.run(async () => {
        for (const frere of freresParent) {
          if (frere.ordre >= nouvelOrdre) {
            await this.articleCentreAideRepository.modifierOrdreEtParent(
              frere.id,
              frere.ordre + 1,
              frere.parentId,
            );
          }
        }

        await this.articleCentreAideRepository.modifierOrdreEtParent(
          id,
          nouvelOrdre,
          parent.parentId,
        );

        const anciensFreres =
          await this.articleCentreAideRepository.listerParParent(
            article.parentId,
          );
        const anciensFreresSansArticle = anciensFreres.filter(
          (frere) => frere.id !== id,
        );
        for (
          let indexFrere = 0;
          indexFrere < anciensFreresSansArticle.length;
          indexFrere++
        ) {
          await this.articleCentreAideRepository.modifierOrdreEtParent(
            anciensFreresSansArticle[indexFrere].id,
            indexFrere,
            anciensFreresSansArticle[indexFrere].parentId,
          );
        }
      });
    }

    if (action === "entrer") {
      const groupeVoisin = [...freres]
        .slice(0, index)
        .reverse()
        .find((frere) => frere.type === "GROUPE");
      if (!groupeVoisin) return;

      const enfantsGroupe =
        await this.articleCentreAideRepository.listerParParent(groupeVoisin.id);
      const nouvelOrdre = enfantsGroupe.length;

      await this.transaction.run(async () => {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          id,
          nouvelOrdre,
          groupeVoisin.id,
        );

        const anciensFreres =
          await this.articleCentreAideRepository.listerParParent(
            article.parentId,
          );
        const anciensFreresSansArticle = anciensFreres.filter(
          (frere) => frere.id !== id,
        );
        for (
          let indexFrere = 0;
          indexFrere < anciensFreresSansArticle.length;
          indexFrere++
        ) {
          await this.articleCentreAideRepository.modifierOrdreEtParent(
            anciensFreresSansArticle[indexFrere].id,
            indexFrere,
            anciensFreresSansArticle[indexFrere].parentId,
          );
        }
      });
    }
  }
}

import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import type { Inject } from "@/server/parametrage-centre-aide/module";

type ActionDeplacement = "monter" | "descendre" | "sortir" | "entrer";

export class DeplacerArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: Inject<"articleCentreAideRepository">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute({ id, action }: { id: string; action: ActionDeplacement }) {
    const article = await this.articleCentreAideRepository.recupererParId(id);
    if (!article) throw new Error("Article introuvable");

    const freres = await this.articleCentreAideRepository.listerParParent(
      article.parentId,
    );
    const index = freres.findIndex((frere) => frere.id === id);

    if (action === "monter") {
      if (index <= 0) return;
      const precedent = freres[index - 1];
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
    }

    if (action === "descendre") {
      if (index >= freres.length - 1) return;
      const suivant = freres[index + 1];
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
      const nouvelOrdre = indexParent + 1;

      for (const frere of freresParent) {
        if (frere.ordre >= nouvelOrdre && frere.id !== id) {
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
      for (
        let indexFrere = 0;
        indexFrere < anciensFreres.length;
        indexFrere++
      ) {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          anciensFreres[indexFrere].id,
          indexFrere,
          anciensFreres[indexFrere].parentId,
        );
      }
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

      await this.articleCentreAideRepository.modifierOrdreEtParent(
        id,
        nouvelOrdre,
        groupeVoisin.id,
      );

      const anciensFreres =
        await this.articleCentreAideRepository.listerParParent(
          article.parentId,
        );
      for (
        let indexFrere = 0;
        indexFrere < anciensFreres.length;
        indexFrere++
      ) {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          anciensFreres[indexFrere].id,
          indexFrere,
          anciensFreres[indexFrere].parentId,
        );
      }
    }
  }
}

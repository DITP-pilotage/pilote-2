import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import type { Inject } from "@/server/parametrage-centre-aide/module";

export class ListerArticlesCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: Inject<"articleCentreAideRepository">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute(): Promise<ArticleCentreAide[]> {
    return this.articleCentreAideRepository.lister();
  }
}

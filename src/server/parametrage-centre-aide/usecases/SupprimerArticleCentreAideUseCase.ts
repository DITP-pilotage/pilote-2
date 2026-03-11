import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import type { Inject } from "@/server/parametrage-centre-aide/module";

export class SupprimerArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: Inject<"articleCentreAideRepository">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute({ id }: { id: string }) {
    return this.articleCentreAideRepository.supprimer(id);
  }
}

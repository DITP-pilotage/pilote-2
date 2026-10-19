import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import type { Inject } from "@/server/parametrage-centre-aide/module";

export class PublierArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: Inject<"articleCentreAideRepository">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute({ id }: { id: string }) {
    const existant = await this.articleCentreAideRepository.recupererParId(id);
    if (!existant) throw new Error(`Article ${id} introuvable`);

    return this.articleCentreAideRepository.modifier(existant.publier());
  }
}

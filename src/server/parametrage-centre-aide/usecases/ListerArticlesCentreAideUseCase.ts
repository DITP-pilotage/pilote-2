import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";

type Dependencies = {
  articleCentreAideRepository: ArticleCentreAideRepository;
};

export class ListerArticlesCentreAideUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(): Promise<ArticleCentreAide[]> {
    return this.deps.articleCentreAideRepository.lister();
  }
}

import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";

type Dependencies = {
  articleCentreAideRepository: ArticleCentreAideRepository;
};

export class SupprimerArticleCentreAideUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute({ id }: { id: string }) {
    return this.deps.articleCentreAideRepository.supprimer(id);
  }
}

import { asClass, AwilixContainer } from "awilix";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { CreerArticleCentreAideUseCase } from "./usecases/CreerArticleCentreAideUseCase";
import { PrismaArticleCentreAideRepository } from "./infrastructure/adapters/PrismaArticleCentreAideRepository";
import { ArticleCentreAideRepository } from "./domain/ports/ArticleCentreAideRepository";
import { ListerArticlesCentreAideUseCase } from "./usecases/ListerArticlesCentreAideUseCase";
import { ModifierArticleCentreAideUseCase } from "./usecases/ModifierArticleCentreAideUseCase";
import { SupprimerArticleCentreAideUseCase } from "./usecases/SupprimerArticleCentreAideUseCase";

export type ParametrageCentreAideDependencies = {
  creerArticleCentreAideUseCase: CreerArticleCentreAideUseCase;
  articleCentreAideRepository: ArticleCentreAideRepository;
  listerArticlesCentreAideUseCase: ListerArticlesCentreAideUseCase;
  modifierArticleCentreAideUseCase: ModifierArticleCentreAideUseCase;
  supprimerArticleCentreAideUseCase: SupprimerArticleCentreAideUseCase;
};

export const getParametrageCentreAideContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<
  ParametrageCentreAideDependencies & { prisma: PrismaPilote }
> => {
  return initialContainer
    .createScope<ParametrageCentreAideDependencies>()
    .register({
      creerArticleCentreAideUseCase: asClass(CreerArticleCentreAideUseCase),
      articleCentreAideRepository: asClass(PrismaArticleCentreAideRepository),
      listerArticlesCentreAideUseCase: asClass(ListerArticlesCentreAideUseCase),
      modifierArticleCentreAideUseCase: asClass(
        ModifierArticleCentreAideUseCase,
      ),
      supprimerArticleCentreAideUseCase: asClass(
        SupprimerArticleCentreAideUseCase,
      ),
    });
};

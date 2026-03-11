import { asClass } from "awilix";
import { defineModule, type NoExports } from "@/server/module-system";
import { CreerArticleCentreAideUseCase} from "./usecases/CreerArticleCentreAideUseCase";
import { PrismaArticleCentreAideRepository } from "./infrastructure/adapters/PrismaArticleCentreAideRepository";
import { ArticleCentreAideRepository } from "./domain/ports/ArticleCentreAideRepository";
import { ListerArticlesCentreAideUseCase } from "./usecases/ListerArticlesCentreAideUseCase";
import { ModifierArticleCentreAideUseCase } from "./usecases/ModifierArticleCentreAideUseCase";
import { SupprimerArticleCentreAideUseCase } from "./usecases/SupprimerArticleCentreAideUseCase";

type ParametrageCentreAideCradle = NoExports & {
  creerArticleCentreAideUseCase: CreerArticleCentreAideUseCase;
  articleCentreAideRepository: ArticleCentreAideRepository;
  listerArticlesCentreAideUseCase: ListerArticlesCentreAideUseCase;
  modifierArticleCentreAideUseCase: ModifierArticleCentreAideUseCase;
  supprimerArticleCentreAideUseCase: SupprimerArticleCentreAideUseCase;
};

export const parametrageCentreAideModule = defineModule<
  NoExports,
  ParametrageCentreAideCradle
>()({
  name: "parametrageCentreAide",
  imports: ["shared"],
  exports: [],
  register: (container) => {
    container.register({
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
  },
});

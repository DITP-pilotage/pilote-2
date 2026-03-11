import {
  defineModule,
  type ModuleScope,
  type NoExports,
} from "@/server/module-system";
import { CreerArticleCentreAideUseCase } from "./usecases/CreerArticleCentreAideUseCase";
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
  register: (container, { asModuleClass }) => {
    container.register({
      creerArticleCentreAideUseCase: asModuleClass(
        CreerArticleCentreAideUseCase,
      ),
      articleCentreAideRepository: asModuleClass(
        PrismaArticleCentreAideRepository,
      ),
      listerArticlesCentreAideUseCase: asModuleClass(
        ListerArticlesCentreAideUseCase,
      ),
      modifierArticleCentreAideUseCase: asModuleClass(
        ModifierArticleCentreAideUseCase,
      ),
      supprimerArticleCentreAideUseCase: asModuleClass(
        SupprimerArticleCentreAideUseCase,
      ),
    });
  },
});

type Scope = ModuleScope<ParametrageCentreAideCradle>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

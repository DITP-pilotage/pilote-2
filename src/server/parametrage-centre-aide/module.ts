import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { CreerArticleCentreAideUseCase } from "./usecases/CreerArticleCentreAideUseCase";
import { PrismaArticleCentreAideRepository } from "./infrastructure/adapters/PrismaArticleCentreAideRepository";
import { ArticleCentreAideRepository } from "./domain/ports/ArticleCentreAideRepository";
import { ListerArticlesCentreAideUseCase } from "./usecases/ListerArticlesCentreAideUseCase";
import { ModifierArticleCentreAideUseCase } from "./usecases/ModifierArticleCentreAideUseCase";
import { SupprimerArticleCentreAideUseCase } from "./usecases/SupprimerArticleCentreAideUseCase";
import { PublierArticleCentreAideUseCase } from "./usecases/PublierArticleCentreAideUseCase";
import { DepublierArticleCentreAideUseCase } from "./usecases/DepublierArticleCentreAideUseCase";
import { BasculerVisibiliteArticleCentreAideUseCase } from "./usecases/BasculerVisibiliteArticleCentreAideUseCase";

type ParametrageCentreAideCradle = {
  creerArticleCentreAideUseCase: CreerArticleCentreAideUseCase;
  articleCentreAideRepository: ArticleCentreAideRepository;
  listerArticlesCentreAideUseCase: ListerArticlesCentreAideUseCase;
  modifierArticleCentreAideUseCase: ModifierArticleCentreAideUseCase;
  supprimerArticleCentreAideUseCase: SupprimerArticleCentreAideUseCase;
  publierArticleCentreAideUseCase: PublierArticleCentreAideUseCase;
  depublierArticleCentreAideUseCase: DepublierArticleCentreAideUseCase;
  basculerVisibiliteArticleCentreAideUseCase: BasculerVisibiliteArticleCentreAideUseCase;
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
      publierArticleCentreAideUseCase: asModuleClass(
        PublierArticleCentreAideUseCase,
      ),
      depublierArticleCentreAideUseCase: asModuleClass(
        DepublierArticleCentreAideUseCase,
      ),
      basculerVisibiliteArticleCentreAideUseCase: asModuleClass(
        BasculerVisibiliteArticleCentreAideUseCase,
      ),
    } satisfies VerifyCradle<ParametrageCentreAideCradle>);
  },
});

type Scope = ExtractScope<typeof parametrageCentreAideModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

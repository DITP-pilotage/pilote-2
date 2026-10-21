import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import { Transaction } from "@/server/framework/persistence/Transaction";
import { PrismaTransaction } from "@/server/framework/persistence/PrismaTransaction";
import { CreerArticleCentreAideUseCase } from "./usecases/CreerArticleCentreAideUseCase";
import { PrismaArticleCentreAideRepository } from "./infrastructure/adapters/PrismaArticleCentreAideRepository";
import { ArticleCentreAideRepository } from "./domain/ports/ArticleCentreAideRepository";
import { ListerArticlesCentreAideUseCase } from "./usecases/ListerArticlesCentreAideUseCase";
import { ModifierArticleCentreAideUseCase } from "./usecases/ModifierArticleCentreAideUseCase";
import { SupprimerArticleCentreAideUseCase } from "./usecases/SupprimerArticleCentreAideUseCase";
import { PublierArticleCentreAideUseCase } from "./usecases/PublierArticleCentreAideUseCase";
import { DepublierArticleCentreAideUseCase } from "./usecases/DepublierArticleCentreAideUseCase";
import { BasculerVisibiliteArticleCentreAideUseCase } from "./usecases/BasculerVisibiliteArticleCentreAideUseCase";
import { DeplacerArticleCentreAideUseCase } from "./usecases/DeplacerArticleCentreAideUseCase";
import { GetSommaireCentreAideQuery } from "./queries/GetSommaireCentreAideQuery";
import { GetPagesCentreAideQuery } from "./queries/GetPagesCentreAideQuery";

type ParametrageCentreAideExports = {
  getSommaireCentreAideQuery: GetSommaireCentreAideQuery;
  getPagesCentreAideQuery: GetPagesCentreAideQuery;
};

type ParametrageCentreAideCradle = ParametrageCentreAideExports & {
  creerArticleCentreAideUseCase: CreerArticleCentreAideUseCase;
  articleCentreAideRepository: ArticleCentreAideRepository;
  listerArticlesCentreAideUseCase: ListerArticlesCentreAideUseCase;
  modifierArticleCentreAideUseCase: ModifierArticleCentreAideUseCase;
  supprimerArticleCentreAideUseCase: SupprimerArticleCentreAideUseCase;
  publierArticleCentreAideUseCase: PublierArticleCentreAideUseCase;
  depublierArticleCentreAideUseCase: DepublierArticleCentreAideUseCase;
  basculerVisibiliteArticleCentreAideUseCase: BasculerVisibiliteArticleCentreAideUseCase;
  deplacerArticleCentreAideUseCase: DeplacerArticleCentreAideUseCase;
  transaction: Transaction;
};

export const parametrageCentreAideModule = defineModule<
  ParametrageCentreAideExports,
  ParametrageCentreAideCradle
>()({
  name: "parametrageCentreAide",
  imports: ["framework"],
  exports: ["getSommaireCentreAideQuery", "getPagesCentreAideQuery"],
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
      deplacerArticleCentreAideUseCase: asModuleClass(
        DeplacerArticleCentreAideUseCase,
      ),
      transaction: asModuleClass(PrismaTransaction),
      getSommaireCentreAideQuery: asModuleClass(GetSommaireCentreAideQuery),
      getPagesCentreAideQuery: asModuleClass(GetPagesCentreAideQuery),
    } satisfies VerifyCradle<ParametrageCentreAideCradle>);
  },
});

type Scope = ExtractScope<typeof parametrageCentreAideModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
export type { ParametrageCentreAideExports };

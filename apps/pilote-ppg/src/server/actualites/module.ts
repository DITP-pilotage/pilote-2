import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { BrevoNewsletterRepository } from "./infrastructure/adapters/BrevoNewsletterRepository";
import { NewsletterRepository } from "./domain/ports/NewsletterRepository";
import { ListerNewslettersUseCase } from "./usecases/ListerNewslettersUseCase";

type ActualitesCradle = {
  newsletterRepository: NewsletterRepository;
  listerNewslettersUseCase: ListerNewslettersUseCase;
};

export const actualitesModule = defineModule<NoExports, ActualitesCradle>()({
  name: "actualites",
  imports: [],
  exports: [],
  register: (container, { asModuleClass, asModuleFunction }) => {
    container.register({
      newsletterRepository: asModuleFunction(
        () => new BrevoNewsletterRepository(),
      ),
      listerNewslettersUseCase: asModuleClass(ListerNewslettersUseCase),
    } satisfies VerifyCradle<ActualitesCradle>);
  },
});

type Scope = ExtractScope<typeof actualitesModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

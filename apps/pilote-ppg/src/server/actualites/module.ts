import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { BrevoNewsletterRepository } from "./infrastructure/adapters/BrevoNewsletterRepository";
import { NewsletterRepository } from "./domain/ports/NewsletterRepository";
import { ListerNewslettersUseCase } from "./usecases/ListerNewslettersUseCase";
import { RecupererNewsletterUseCase } from "./usecases/RecupererNewsletterUseCase";

type ActualitesCradle = {
  newsletterRepository: NewsletterRepository;
  listerNewslettersUseCase: ListerNewslettersUseCase;
  recupererNewsletterUseCase: RecupererNewsletterUseCase;
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
      recupererNewsletterUseCase: asModuleClass(RecupererNewsletterUseCase),
    } satisfies VerifyCradle<ActualitesCradle>);
  },
});

type Scope = ExtractScope<typeof actualitesModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

import {
  defineModule,
  type ExtractScope,
  type NoExports,
} from "@/server/module-system";
import { CreerNouveauteUseCase } from "./usecases/CreerNouveauteUseCase";
import { PrismaNouveauteRepository } from "./infrastructure/adapters/PrismaNouveauteRepository";
import { NouveauteRepository } from "./domain/ports/NouveauteRepository";
import { ListerNouveautesUseCase } from "./usecases/ListerNouveautesUseCase";
import { ModifierNouveauteUseCase } from "./usecases/ModifierNouveauteUseCase";

type ParametrageNouveautesCradle = NoExports & {
  creerNouveauteUseCase: CreerNouveauteUseCase;
  nouveauteRepository: NouveauteRepository;
  listerNouveautesUseCase: ListerNouveautesUseCase;
  modifierNouveauteUseCase: ModifierNouveauteUseCase;
};

export const parametrageNouveautesModule = defineModule<
  NoExports,
  ParametrageNouveautesCradle
>()({
  name: "parametrageNouveautes",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      creerNouveauteUseCase: asModuleClass(CreerNouveauteUseCase),
      nouveauteRepository: asModuleClass(PrismaNouveauteRepository),
      listerNouveautesUseCase: asModuleClass(ListerNouveautesUseCase),
      modifierNouveauteUseCase: asModuleClass(ModifierNouveauteUseCase),
    });
  },
});

type Scope = ExtractScope<typeof parametrageNouveautesModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

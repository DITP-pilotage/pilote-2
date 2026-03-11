import { asClass } from "awilix";
import { defineModule, type NoExports } from "@/server/module-system";
import { CreerNouveauteUseCase} from "./usecases/CreerNouveauteUseCase";
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
  register: (container) => {
    container.register({
      creerNouveauteUseCase: asClass(CreerNouveauteUseCase),
      nouveauteRepository: asClass(PrismaNouveauteRepository),
      listerNouveautesUseCase: asClass(ListerNouveautesUseCase),
      modifierNouveauteUseCase: asClass(ModifierNouveauteUseCase),
    });
  },
});

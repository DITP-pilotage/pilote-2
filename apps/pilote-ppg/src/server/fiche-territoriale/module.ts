import { ChantierRepository } from "@/server/fiche-territoriale/domain/ports/ChantierRepository";
import { IndicateurRepository } from "@/server/fiche-territoriale/domain/ports/IndicateurRepository";
import { MinistereRepository } from "@/server/fiche-territoriale/domain/ports/MinistereRepository";
import { SyntheseDesResultatsRepository } from "@/server/fiche-territoriale/domain/ports/SyntheseDesResultatsRepository";
import { TerritoireRepository } from "@/server/fiche-territoriale/domain/ports/TerritoireRepository";
import { PrismaChantierRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaChantierRepository";
import { PrismaIndicateurRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaIndicateurRepository";
import { PrismaMinistereRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaMinistereRepository";
import { PrismaSyntheseDesResultatsRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaSyntheseDesResultatsRepository";
import { PrismaTerritoireRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaTerritoireRepository";
import { RecupererListeChantierFicheTerritorialeUseCase } from "@/server/fiche-territoriale/usecases/RecupererListeChantierFicheTerritorialeUseCase";
import { RecupererRepartitionMeteoUseCase } from "@/server/fiche-territoriale/usecases/RecupererRepartitionMeteoUseCase";
import { RecupererTauxAvancementTerritoireUseCase } from "@/server/fiche-territoriale/usecases/RecupererTauxAvancementTerritoireUseCase";
import { RecupererTerritoireParCodeUseCase } from "@/server/fiche-territoriale/usecases/RecupererTerritoireParCodeUseCase";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";

type FicheTerritorialeCradle = {
  chantierRepository: ChantierRepository;
  indicateurRepository: IndicateurRepository;
  ministereRepository: MinistereRepository;
  syntheseDesResultatsRepository: SyntheseDesResultatsRepository;
  territoireRepository: TerritoireRepository;
  récupérerTerritoireParCodeUseCase: RecupererTerritoireParCodeUseCase;
  récupérerTauxAvancementTerritoireUseCase: RecupererTauxAvancementTerritoireUseCase;
  récupérerRépartitionMétéoUseCase: RecupererRepartitionMeteoUseCase;
  récupérerListeChantierFicheTerritorialeUseCase: RecupererListeChantierFicheTerritorialeUseCase;
};

export const ficheTerritorialeModule = defineModule<
  NoExports,
  FicheTerritorialeCradle
>()({
  name: "ficheTerritoriale",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      chantierRepository: asModuleClass(PrismaChantierRepository).scoped(),
      indicateurRepository: asModuleClass(PrismaIndicateurRepository).scoped(),
      ministereRepository: asModuleClass(PrismaMinistereRepository).scoped(),
      syntheseDesResultatsRepository: asModuleClass(
        PrismaSyntheseDesResultatsRepository,
      ).scoped(),
      territoireRepository: asModuleClass(PrismaTerritoireRepository).scoped(),
      récupérerTerritoireParCodeUseCase: asModuleClass(
        RecupererTerritoireParCodeUseCase,
      ).scoped(),
      récupérerTauxAvancementTerritoireUseCase: asModuleClass(
        RecupererTauxAvancementTerritoireUseCase,
      ).scoped(),
      récupérerRépartitionMétéoUseCase: asModuleClass(
        RecupererRepartitionMeteoUseCase,
      ).scoped(),
      récupérerListeChantierFicheTerritorialeUseCase: asModuleClass(
        RecupererListeChantierFicheTerritorialeUseCase,
      ).scoped(),
    } satisfies VerifyCradle<FicheTerritorialeCradle>);
  },
});

type Scope = ExtractScope<typeof ficheTerritorialeModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

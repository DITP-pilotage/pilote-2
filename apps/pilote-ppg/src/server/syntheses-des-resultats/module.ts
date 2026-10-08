import { ImportSyntheseDesResultatsAPIHandler } from "@/server/syntheses-des-resultats/infrastructure/handlers/ImportSyntheseDesResultatsAPIHandler";
import { ImporterSynthesesDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ImporterSynthesesDesResultatsUseCase";
import { RecupererDerniereSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererDerniereSyntheseDesResultatsQuery";
import { RecupererHistoriqueSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererHistoriqueSyntheseDesResultatsQuery";
import { RecupererBrouillonSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererBrouillonSyntheseDesResultatsQuery";
import { SyntheseDesResultatsRepository } from "@/server/syntheses-des-resultats/infrastructure/sql/SyntheseDesResultatsRepository.interface";
import { SynthèseDesRésultatsSQLRepository } from "@/server/syntheses-des-resultats/infrastructure/sql/SyntheseDesResultatsSQLRepository";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import { Transaction } from "@/server/framework/persistence/Transaction";
import { PrismaTransaction } from "@/server/framework/persistence/PrismaTransaction";
import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { PublierSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/PublierSyntheseDesResultatsUseCase";
import { EnregistrerBrouillonSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/EnregistrerBrouillonSyntheseDesResultatsUseCase";
import { ModifierSyntheseDesResultatsPublieeUseCase } from "@/server/syntheses-des-resultats/usecases/ModifierSyntheseDesResultatsPublieeUseCase";
import { PublierBrouillonSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/PublierBrouillonSyntheseDesResultatsUseCase";
import { ModifierBrouillonSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ModifierBrouillonSyntheseDesResultatsUseCase";

type ImportSyntheseDesResultatsCradle = {
  importSyntheseDesResultatsAPIHandler: ImportSyntheseDesResultatsAPIHandler;
  importerSynthesesDesResultatsUseCase: ImporterSynthesesDesResultatsUseCase;
  enregistrerSyntheseDesResultatsService: EnregistrerSyntheseDesResultatsService;
  publierSyntheseDesResultatsUseCase: PublierSyntheseDesResultatsUseCase;
  enregistrerBrouillonSyntheseDesResultatsUseCase: EnregistrerBrouillonSyntheseDesResultatsUseCase;
  modifierSyntheseDesResultatsPublieeUseCase: ModifierSyntheseDesResultatsPublieeUseCase;
  publierBrouillonSyntheseDesResultatsUseCase: PublierBrouillonSyntheseDesResultatsUseCase;
  modifierBrouillonSyntheseDesResultatsUseCase: ModifierBrouillonSyntheseDesResultatsUseCase;
  récupérerDerniereSyntheseDesResultatsQuery: RecupererDerniereSyntheseDesResultatsQuery;
  récupérerHistoriqueSyntheseDesResultatsQuery: RecupererHistoriqueSyntheseDesResultatsQuery;
  recupererDernierBrouillonSyntheseDesResultatsQuery: RecupererBrouillonSyntheseDesResultatsQuery;
  synthèseDesRésultatsRepository: SyntheseDesResultatsRepository;
  chantierRepository: ChantierRepository;
  transaction: Transaction;
};

export type ImportSyntheseDesResultatsExports = Pick<
  ImportSyntheseDesResultatsCradle,
  "importerSynthesesDesResultatsUseCase"
>;

export const importSyntheseDesResultatsModule = defineModule<
  ImportSyntheseDesResultatsExports,
  ImportSyntheseDesResultatsCradle
>()({
  name: "importSyntheseDesResultats",
  imports: ["framework"],
  exports: ["importerSynthesesDesResultatsUseCase"],
  register: (container, { asModuleClass }) => {
    container.register({
      synthèseDesRésultatsRepository: asModuleClass(
        SynthèseDesRésultatsSQLRepository,
      ),
      chantierRepository: asModuleClass(PrismaChantierRepository),
      transaction: asModuleClass(PrismaTransaction),
      enregistrerSyntheseDesResultatsService: asModuleClass(
        EnregistrerSyntheseDesResultatsService,
      ),
      importerSynthesesDesResultatsUseCase: asModuleClass(
        ImporterSynthesesDesResultatsUseCase,
      ),
      publierSyntheseDesResultatsUseCase: asModuleClass(
        PublierSyntheseDesResultatsUseCase,
      ),
      enregistrerBrouillonSyntheseDesResultatsUseCase: asModuleClass(
        EnregistrerBrouillonSyntheseDesResultatsUseCase,
      ),
      modifierSyntheseDesResultatsPublieeUseCase: asModuleClass(
        ModifierSyntheseDesResultatsPublieeUseCase,
      ),
      publierBrouillonSyntheseDesResultatsUseCase: asModuleClass(
        PublierBrouillonSyntheseDesResultatsUseCase,
      ),
      modifierBrouillonSyntheseDesResultatsUseCase: asModuleClass(
        ModifierBrouillonSyntheseDesResultatsUseCase,
      ),
      récupérerDerniereSyntheseDesResultatsQuery: asModuleClass(
        RecupererDerniereSyntheseDesResultatsQuery,
      ),
      récupérerHistoriqueSyntheseDesResultatsQuery: asModuleClass(
        RecupererHistoriqueSyntheseDesResultatsQuery,
      ),
      recupererDernierBrouillonSyntheseDesResultatsQuery: asModuleClass(
        RecupererBrouillonSyntheseDesResultatsQuery,
      ),
      importSyntheseDesResultatsAPIHandler: asModuleClass(
        ImportSyntheseDesResultatsAPIHandler,
      ),
    } satisfies VerifyCradle<ImportSyntheseDesResultatsCradle>);
  },
});

type Scope = ExtractScope<typeof importSyntheseDesResultatsModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

import { asClass } from "awilix";
import { ImportSyntheseDesResultatsAPIHandler } from "@/server/syntheses-des-resultats/infrastructure/handlers/ImportSyntheseDesResultatsAPIHandler";
import { ImporterSynthesesDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ImporterSynthesesDesResultatsUseCase";
import { RecupererDerniereSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererDerniereSyntheseDesResultatsQuery";
import { RecupererHistoriqueSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererHistoriqueSyntheseDesResultatsQuery";
import { RecupererBrouillonSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererBrouillonSyntheseDesResultatsQuery";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import { Transaction } from "@/server/db/Transaction";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { defineModule, type NoExports } from "@/server/module-system";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { PublierSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/PublierSyntheseDesResultatsUseCase";
import { EnregistrerBrouillonSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/EnregistrerBrouillonSyntheseDesResultatsUseCase";
import { ModifierSyntheseDesResultatsPublieeUseCase } from "@/server/syntheses-des-resultats/usecases/ModifierSyntheseDesResultatsPublieeUseCase";
import { PublierBrouillonSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/PublierBrouillonSyntheseDesResultatsUseCase";
import { ModifierBrouillonSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ModifierBrouillonSyntheseDesResultatsUseCase";

type ImportSyntheseDesResultatsCradle = NoExports & {
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
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
  chantierRepository: ChantierRepository;
  transaction: Transaction;
};

export const importSyntheseDesResultatsModule = defineModule<
  NoExports,
  ImportSyntheseDesResultatsCradle
>()({
  name: "importSyntheseDesResultats",
  imports: ["shared"],
  exports: [],
  register: (container) => {
    container.register({
      synthèseDesRésultatsRepository: asClass(
        SynthèseDesRésultatsSQLRepository,
      ),
      chantierRepository: asClass(PrismaChantierRepository),
      transaction: asClass(PrismaTransaction),
      enregistrerSyntheseDesResultatsService: asClass(
        EnregistrerSyntheseDesResultatsService,
      ),
      importerSynthesesDesResultatsUseCase: asClass(
        ImporterSynthesesDesResultatsUseCase,
      ),
      publierSyntheseDesResultatsUseCase: asClass(
        PublierSyntheseDesResultatsUseCase,
      ),
      enregistrerBrouillonSyntheseDesResultatsUseCase: asClass(
        EnregistrerBrouillonSyntheseDesResultatsUseCase,
      ),
      modifierSyntheseDesResultatsPublieeUseCase: asClass(
        ModifierSyntheseDesResultatsPublieeUseCase,
      ),
      publierBrouillonSyntheseDesResultatsUseCase: asClass(
        PublierBrouillonSyntheseDesResultatsUseCase,
      ),
      modifierBrouillonSyntheseDesResultatsUseCase: asClass(
        ModifierBrouillonSyntheseDesResultatsUseCase,
      ),
      récupérerDerniereSyntheseDesResultatsQuery: asClass(
        RecupererDerniereSyntheseDesResultatsQuery,
      ),
      récupérerHistoriqueSyntheseDesResultatsQuery: asClass(
        RecupererHistoriqueSyntheseDesResultatsQuery,
      ),
      recupererDernierBrouillonSyntheseDesResultatsQuery: asClass(
        RecupererBrouillonSyntheseDesResultatsQuery,
      ),
      importSyntheseDesResultatsAPIHandler: asClass(
        ImportSyntheseDesResultatsAPIHandler,
      ),
    });
  },
});

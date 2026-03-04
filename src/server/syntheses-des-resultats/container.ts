import { asClass, AwilixContainer } from "awilix";
import { ImportSyntheseDesResultatsAPIHandler } from "@/server/syntheses-des-resultats/infrastructure/handlers/ImportSyntheseDesResultatsAPIHandler";
import { ImporterSynthesesDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ImporterSynthesesDesResultatsUseCase";
import { ModifierUneSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ModifierUneSyntheseDesResultatsUseCase";
import { CreerUneSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/CreerUneSyntheseDesResultatsUseCase";
import { RecupererDerniereSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererDerniereSyntheseDesResultatsQuery";
import { RecupererHistoriqueSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererHistoriqueSyntheseDesResultatsQuery";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import { Transaction } from "@/server/db/Transaction";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ImportSyntheseDesResultatsDependencies = {
  importSyntheseDesResultatsAPIHandler: ImportSyntheseDesResultatsAPIHandler;
  importerSynthesesDesResultatsUseCase: ImporterSynthesesDesResultatsUseCase;
  modifierUneSyntheseDesResultatsUseCase: ModifierUneSyntheseDesResultatsUseCase;
  créerUneSyntheseDesResultatsUseCase: CreerUneSyntheseDesResultatsUseCase;
  récupérerDerniereSyntheseDesResultatsQuery: RecupererDerniereSyntheseDesResultatsQuery;
  récupérerHistoriqueSyntheseDesResultatsQuery: RecupererHistoriqueSyntheseDesResultatsQuery;
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
  chantierRepository: ChantierRepository;
  transaction: Transaction;
};

export const getImportSyntheseDesResultatsContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<
  ImportSyntheseDesResultatsDependencies & { prisma: PrismaPilote }
> => {
  return initialContainer
    .createScope<ImportSyntheseDesResultatsDependencies>()
    .register({
      synthèseDesRésultatsRepository: asClass(
        SynthèseDesRésultatsSQLRepository,
      ),
      chantierRepository: asClass(PrismaChantierRepository),
      transaction: asClass(PrismaTransaction),
      importerSynthesesDesResultatsUseCase: asClass(
        ImporterSynthesesDesResultatsUseCase,
      ),
      modifierUneSyntheseDesResultatsUseCase: asClass(
        ModifierUneSyntheseDesResultatsUseCase,
      ),
      créerUneSyntheseDesResultatsUseCase: asClass(
        CreerUneSyntheseDesResultatsUseCase,
      ),
      récupérerDerniereSyntheseDesResultatsQuery: asClass(
        RecupererDerniereSyntheseDesResultatsQuery,
      ),
      récupérerHistoriqueSyntheseDesResultatsQuery: asClass(
        RecupererHistoriqueSyntheseDesResultatsQuery,
      ),
      importSyntheseDesResultatsAPIHandler: asClass(
        ImportSyntheseDesResultatsAPIHandler,
      ),
    });
};

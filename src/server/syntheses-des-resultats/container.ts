import { asClass, AwilixContainer } from "awilix";
import { ImportSyntheseDesResultatsAPIHandler } from "@/server/syntheses-des-resultats/infrastructure/handlers/ImportSyntheseDesResultatsAPIHandler";
import { ImporterSynthesesDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ImporterSynthesesDesResultatsUseCase";
import { ModifierUneSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ModifierUneSyntheseDesResultatsUseCase";
import { RecupererDerniereSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererDerniereSyntheseDesResultatsQuery";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import ChantierSQLRepository from "@/server/infrastructure/accès_données/chantier/ChantierSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ImportSyntheseDesResultatsDependencies = {
  importSyntheseDesResultatsAPIHandler: ImportSyntheseDesResultatsAPIHandler;
  importerSynthesesDesResultatsUseCase: ImporterSynthesesDesResultatsUseCase;
  modifierUneSyntheseDesResultatsUseCase: ModifierUneSyntheseDesResultatsUseCase;
  récupérerDerniereSyntheseDesResultatsQuery: RecupererDerniereSyntheseDesResultatsQuery;
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
  chantierRepository: ChantierRepository;
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
      chantierRepository: asClass(ChantierSQLRepository),
      importerSynthesesDesResultatsUseCase: asClass(
        ImporterSynthesesDesResultatsUseCase,
      ),
      modifierUneSyntheseDesResultatsUseCase: asClass(
        ModifierUneSyntheseDesResultatsUseCase,
      ),
      récupérerDerniereSyntheseDesResultatsQuery: asClass(
        RecupererDerniereSyntheseDesResultatsQuery,
      ),
      importSyntheseDesResultatsAPIHandler: asClass(
        ImportSyntheseDesResultatsAPIHandler,
      ),
    });
};

import { asClass, AwilixContainer } from "awilix";
import { ImportSyntheseDesResultatsAPIHandler } from "@/server/syntheses-des-resultats/infrastructure/handlers/ImportSyntheseDesResultatsAPIHandler";
import { ImporterSynthesesDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ImporterSynthesesDesResultatsUseCase";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ImportSyntheseDesResultatsDependencies = {
  importSyntheseDesResultatsAPIHandler: ImportSyntheseDesResultatsAPIHandler;
  importerSynthesesDesResultatsUseCase: ImporterSynthesesDesResultatsUseCase;
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
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
      importerSynthesesDesResultatsUseCase: asClass(
        ImporterSynthesesDesResultatsUseCase,
      ),
      importSyntheseDesResultatsAPIHandler: asClass(
        ImportSyntheseDesResultatsAPIHandler,
      ),
    });
};

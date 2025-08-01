import { asClass, AwilixContainer } from "awilix";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { RecupererDonneesChantierQuery } from "@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { ExportCsvDesIndicateursUseCaseV2 } from "@/server/chantiers/usecases/ExportCsvDesIndicateursUseCaseV2";
import { ExportCsvDesHistoriquesIndicateursUseCase } from "@/server/chantiers/usecases/ExportCsvDesHistoriquesIndicateursUseCase";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PropositionValeurAvancementRepository } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { PrismaPropositionValeurAvancementRepository } from "@/server/chantiers/infrastructure/adapters/PrismaPropositionValeurAvancementRepository";
import { CreerPropositionValeurAvancementUseCase } from "@/server/chantiers/usecases/CreerPropositionValeurAvancementUseCase";
import { ModifierPropositionValeurAvancementUseCase } from "@/server/chantiers/usecases/ModifierPropositionValeurAvancementUseCase";
import { InitialDependencies } from "@/server/InitialDependencies";
import { ExportCsvDesChantiersUseCaseV2 } from "./usecases/ExportCsvDesChantiersUseCaseV2";
import { TerritoireRepository } from "./domain/ports/TerritoireRepository";
import { PrismaTerritoireRepository } from "./infrastructure/adapters/PrismaTerritoireRepository";
import { UtilisateurRepository } from "./domain/ports/UtilisateurRepository";
import { PrismaUtilisateurRepository } from "./infrastructure/adapters/PrismaUtilisateurRepository";
import { EnvoyerLesRapportsPropositionValeurAvancementUseCase } from "./usecases/EnvoyerLesRapportsPropositionValeurAvancementUseCase";
import { EnvoieEmailService } from "./domain/ports/EnvoieEmailService";
import { BrevoEnvoieEmailService } from "./infrastructure/adapters/BrevoEnvoieEmailService";

export type ChantierDependencies = {
  chantierRepository: ChantierRepository;
  indicateurRepository: IndicateurRepository;
  territoireRepository: TerritoireRepository;
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository;
  utilisateurRepository: UtilisateurRepository;
  envoieEmailService: EnvoieEmailService;
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery;
  exportCsvDesChantiersUseCaseV2: ExportCsvDesChantiersUseCaseV2;
  exportCsvDesIndicateursUseCaseV2: ExportCsvDesIndicateursUseCaseV2;
  exportCsvDesHistoriquesIndicateursUseCase: ExportCsvDesHistoriquesIndicateursUseCase;
  creerPropositionValeurAvancementUseCase: CreerPropositionValeurAvancementUseCase;
  modifierPropositionValeurAvancementUseCase: ModifierPropositionValeurAvancementUseCase;
  envoyerLesRapportsPropositionValeurAvancementUseCase: EnvoyerLesRapportsPropositionValeurAvancementUseCase;
};

export const getChantiersContainer = (
  initialContainer: AwilixContainer<InitialDependencies>,
): AwilixContainer<ChantierDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<ChantierDependencies>().register({
    chantierRepository: asClass(PrismaChantierRepository),
    indicateurRepository: asClass(PrismaIndicateurRepository),
    territoireRepository: asClass(PrismaTerritoireRepository),
    propositionValeurAvancementRepository: asClass(
      PrismaPropositionValeurAvancementRepository,
    ),
    utilisateurRepository: asClass(PrismaUtilisateurRepository),
    envoieEmailService: asClass(BrevoEnvoieEmailService),
    recupererDonneesChantierQuery: asClass(RecupererDonneesChantierQuery),
    exportCsvDesChantiersUseCaseV2: asClass(ExportCsvDesChantiersUseCaseV2),
    exportCsvDesIndicateursUseCaseV2: asClass(ExportCsvDesIndicateursUseCaseV2),
    exportCsvDesHistoriquesIndicateursUseCase: asClass(
      ExportCsvDesHistoriquesIndicateursUseCase,
    ),
    creerPropositionValeurAvancementUseCase: asClass(
      CreerPropositionValeurAvancementUseCase,
    ),
    modifierPropositionValeurAvancementUseCase: asClass(
      ModifierPropositionValeurAvancementUseCase,
    ),
    envoyerLesRapportsPropositionValeurAvancementUseCase: asClass(
      EnvoyerLesRapportsPropositionValeurAvancementUseCase,
    ),
  });
};

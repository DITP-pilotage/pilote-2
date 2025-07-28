import { asClass, AwilixContainer } from 'awilix';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { RecupererDonneesChantierQuery } from '@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery';
import { PrismaChantierRepository } from '@/server/chantiers/infrastructure/adapters/PrismaChantierRepository';
import { PrismaIndicateurRepository } from '@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { ExportCsvDesChantiersUseCase } from '@/server/chantiers/usecases/ExportCsvDesChantiersUseCase';
import ExportCsvDesIndicateursUseCase from '@/server/chantiers/usecases/ExportCsvDesIndicateursUseCase';
import { ExportCsvDesIndicateursUseCaseV2 } from '@/server/chantiers/usecases/ExportCsvDesIndicateursUseCaseV2';
import {
  ExportCsvDesHistoriquesIndicateursUseCase,
} from '@/server/chantiers/usecases/ExportCsvDesHistoriquesIndicateursUseCase';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import {
  PropositionValeurAvancementRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurAvancementRepository';
import {
  PrismaPropositionValeurAvancementRepository,
} from '@/server/chantiers/infrastructure/adapters/PrismaPropositionValeurAvancementRepository';
import {
  CreerPropositionValeurAvancementUseCase,
} from '@/server/chantiers/usecases/CreerPropositionValeurAvancementUseCase';
import {
  ModifierPropositionValeurAvancementUseCase,
} from '@/server/chantiers/usecases/ModifierPropositionValeurAvancementUseCase';
import { ExportCsvDesChantiersUseCaseV2 } from './usecases/ExportCsvDesChantiersUseCaseV2';
import { TerritoireRepository } from './domain/ports/TerritoireRepository';
import { PrismaTerritoireRepository } from './infrastructure/adapters/PrismaTerritoireRepository';
import { UtilisateurRepository } from './domain/ports/UtilisateurRepository';
import { PrismaUtilisateurRepository } from './infrastructure/adapters/PrismaUtilisateurRepository';
import { EnvoyerLesRapportsPropositionValeurAvancementUseCase } from './usecases/EnvoyerLesRapportsPropositionValeurAvancementUseCase';
import { EnvoieEmailService } from './domain/ports/EnvoieEmailService';
import { BrevoEnvoieEmailService } from './infrastructure/adapters/BrevoEnvoieEmailService';

export type ChantierDependencies = {
  chantierRepository: ChantierRepository
  indicateurRepository: IndicateurRepository
  territoireRepository: TerritoireRepository
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository
  utilisateurRepository: UtilisateurRepository
  envoieEmailService: EnvoieEmailService
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery
  exportCsvDesChantiersUseCase: ExportCsvDesChantiersUseCase
  exportCsvDesChantiersUseCaseV2: ExportCsvDesChantiersUseCaseV2
  exportCsvDesIndicateursUseCase: ExportCsvDesIndicateursUseCase
  exportCsvDesIndicateursUseCaseV2: ExportCsvDesIndicateursUseCaseV2
  exportCsvDesHistoriquesIndicateursUseCase: ExportCsvDesHistoriquesIndicateursUseCase
  creerPropositionValeurAvancementUseCase: CreerPropositionValeurAvancementUseCase
  modifierPropositionValeurAvancementUseCase: ModifierPropositionValeurAvancementUseCase
  envoyerLesRapportsPropositionValeurAvancementUseCase: EnvoyerLesRapportsPropositionValeurAvancementUseCase
};

export const getChantiersContainer = (initialContainer: AwilixContainer<{ prisma: PrismaPilote }>): AwilixContainer<ChantierDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<ChantierDependencies>().register({
    chantierRepository: asClass(PrismaChantierRepository),
    indicateurRepository: asClass(PrismaIndicateurRepository),
    territoireRepository: asClass(PrismaTerritoireRepository),
    propositionValeurAvancementRepository: asClass(PrismaPropositionValeurAvancementRepository),
    utilisateurRepository: asClass(PrismaUtilisateurRepository),
    envoieEmailService: asClass(BrevoEnvoieEmailService),
    recupererDonneesChantierQuery: asClass(RecupererDonneesChantierQuery),
    exportCsvDesChantiersUseCase: asClass(ExportCsvDesChantiersUseCase),
    exportCsvDesChantiersUseCaseV2: asClass(ExportCsvDesChantiersUseCaseV2),
    exportCsvDesIndicateursUseCase: asClass(ExportCsvDesIndicateursUseCase),
    exportCsvDesIndicateursUseCaseV2: asClass(ExportCsvDesIndicateursUseCaseV2),
    exportCsvDesHistoriquesIndicateursUseCase: asClass(ExportCsvDesHistoriquesIndicateursUseCase),
    creerPropositionValeurAvancementUseCase: asClass(CreerPropositionValeurAvancementUseCase),
    modifierPropositionValeurAvancementUseCase: asClass(ModifierPropositionValeurAvancementUseCase),
    envoyerLesRapportsPropositionValeurAvancementUseCase: asClass(EnvoyerLesRapportsPropositionValeurAvancementUseCase),
  });
};

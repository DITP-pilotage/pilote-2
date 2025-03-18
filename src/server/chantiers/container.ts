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
import { ExportCsvDesChantiersUseCaseV2 } from './usecases/ExportCsvDesChantiersUseCaseV2';

export type ChantierDependencies = {
  chantierRepository: ChantierRepository
  indicateurRepository: IndicateurRepository
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery
  exportCsvDesChantiersUseCase: ExportCsvDesChantiersUseCase
  exportCsvDesChantiersUseCaseV2: ExportCsvDesChantiersUseCaseV2
  exportCsvDesIndicateursUseCase: ExportCsvDesIndicateursUseCase
  exportCsvDesIndicateursUseCaseV2: ExportCsvDesIndicateursUseCaseV2
  exportCsvDesHistoriquesIndicateursUseCase: ExportCsvDesHistoriquesIndicateursUseCase
};

export const getChantiersContainer = (initialContainer: AwilixContainer<{ prisma: PrismaPilote }>): AwilixContainer<ChantierDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<ChantierDependencies>().register({
    chantierRepository: asClass(PrismaChantierRepository),
    indicateurRepository: asClass(PrismaIndicateurRepository),
    recupererDonneesChantierQuery: asClass(RecupererDonneesChantierQuery),
    exportCsvDesChantiersUseCase: asClass(ExportCsvDesChantiersUseCase),
    exportCsvDesChantiersUseCaseV2: asClass(ExportCsvDesChantiersUseCaseV2),
    exportCsvDesIndicateursUseCase: asClass(ExportCsvDesIndicateursUseCase),
    exportCsvDesIndicateursUseCaseV2: asClass(ExportCsvDesIndicateursUseCaseV2),
    exportCsvDesHistoriquesIndicateursUseCase: asClass(ExportCsvDesHistoriquesIndicateursUseCase),
  });
};

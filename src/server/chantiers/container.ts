import { asClass, AwilixContainer, ContainerOptions, createContainer, InjectionMode } from 'awilix';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { RecupererDonneesChantierQuery } from '@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery';
import { PrismaChantierRepository } from '@/server/chantiers/infrastructure/adapters/PrismaChantierRepository';
import { PrismaIndicateurRepository } from '@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { ExportCsvDesChantiersUseCase } from '@/server/chantiers/usecases/ExportCsvDesChantiersUseCase';
import ExportCsvDesIndicateursUseCase from '@/server/chantiers/usecases/ExportCsvDesIndicateursUseCase';

export type ChantierDependencies = {
  chantierRepository: ChantierRepository
  indicateurRepository: IndicateurRepository
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery
  exportCsvDesChantiersUseCase: ExportCsvDesChantiersUseCase
  exportCsvDesIndicateursUseCase: ExportCsvDesIndicateursUseCase
};
export const getChantiersContainer = (): AwilixContainer<ChantierDependencies> => {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };

  const chantier = createContainer<ChantierDependencies>(defaultOptions);

  return chantier.register({
    chantierRepository: asClass(PrismaChantierRepository),
    indicateurRepository: asClass(PrismaIndicateurRepository),
    recupererDonneesChantierQuery: asClass(RecupererDonneesChantierQuery),
    exportCsvDesChantiersUseCase: asClass(ExportCsvDesChantiersUseCase),
    exportCsvDesIndicateursUseCase: asClass(ExportCsvDesIndicateursUseCase),
  });
};

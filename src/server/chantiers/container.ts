import { asClass, AwilixContainer, ContainerOptions, createContainer, InjectionMode } from 'awilix';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { RecupererDonneesChantierQuery } from '@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery';
import { PrismaChantierRepository } from '@/server/chantiers/infrastructure/adapters/PrismaChantierRepository';

export type ChantierDependencies = {
  chantierRepository: ChantierRepository
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery
};
export const getChantiersContainer = (): AwilixContainer<ChantierDependencies> => {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };

  const chantier = createContainer<ChantierDependencies>(defaultOptions);

  return chantier.register({
    chantierRepository: asClass(PrismaChantierRepository),
    recupererDonneesChantierQuery: asClass(RecupererDonneesChantierQuery),
  });
};

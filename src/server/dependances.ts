import type { AwilixContainer } from 'awilix';
import { asClass, createContainer } from 'awilix';
import { RecupererDonneesChantierQuery } from '@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { PrismaChantierRepository } from '@/server/chantiers/infrastructure/adapters/PrismaChantierRepository';

type ChantierDependencies = {
  chantierRepository: ChantierRepository
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery
};

export type ContainerDependencies = ChantierDependencies;

let innerContainer: AwilixContainer<ContainerDependencies>;

declare global {
  var __container: AwilixContainer<ContainerDependencies> | undefined;
}

function registerContainer(container: AwilixContainer<ContainerDependencies>) {
  container.register({
    chantierRepository: asClass(PrismaChantierRepository),
    recupererDonneesChantierQuery: asClass(RecupererDonneesChantierQuery),
  });
}

if (process.env.NODE_ENV === 'production') {
  innerContainer = createContainer<ContainerDependencies>({ injectionMode: 'PROXY' });
  registerContainer(innerContainer);
} else {
  if (!global.__container) {
    global.__container = createContainer();
    registerContainer(global.__container);
  }
  innerContainer = global.__container;
}

export const getContainer = innerContainer.createScope;

import { AwilixContainer } from 'awilix';
import {
  getParametrageIndicateurContainer,
  ParametrageIndicateurDependencies,
} from '@/server/parametrage-indicateur/container';
import { ChantierDependencies, getChantiersContainer } from '@/server/chantiers/container';

export type ContainerDependencies = {
  chantiers: AwilixContainer<ChantierDependencies>,
  parametrageIndicateur: AwilixContainer<ParametrageIndicateurDependencies>
};

function registerContainer(): ContainerDependencies {
  const chantier = getChantiersContainer();
  const parametrageIndicateurContainer = getParametrageIndicateurContainer();

  return {
    chantiers: chantier.createScope(),
    parametrageIndicateur: parametrageIndicateurContainer.createScope(),
  };
}

let innerContainer: ContainerDependencies;

declare global {
  var __container: ContainerDependencies | undefined;
}

if (process.env.NODE_ENV === 'production') {
  innerContainer = registerContainer();
} else {
  if (!global.__container) {
    global.__container = registerContainer();
  }
  innerContainer = global.__container;
}

export const getContainer = <T extends keyof ContainerDependencies>(nameDependency: T) => innerContainer[nameDependency];

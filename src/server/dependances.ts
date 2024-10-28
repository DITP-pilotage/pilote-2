import { AwilixContainer } from 'awilix';
import {
  getParametrageIndicateurContainer,
  ParametrageIndicateurDependencies,
} from '@/server/parametrage-indicateur/container';
import { ChantierDependencies, getChantiersContainer } from '@/server/chantiers/container';
import { getImportIndicateurContainer, ImportIndicateurDependencies } from '@/server/import-indicateur/container';
import { AuthentificationDependencies, getAuthentificationContainer } from '@/server/authentification/container';

export type ContainerDependencies = {
  authentification: AwilixContainer<AuthentificationDependencies>
  chantiers: AwilixContainer<ChantierDependencies>,
  parametrageIndicateur: AwilixContainer<ParametrageIndicateurDependencies>
  importIndicateur: AwilixContainer<ImportIndicateurDependencies>
};

function registerContainer(): ContainerDependencies {
  return {
    authentification: getAuthentificationContainer().createScope(),
    chantiers: getChantiersContainer().createScope(),
    parametrageIndicateur: getParametrageIndicateurContainer().createScope(),
    importIndicateur: getImportIndicateurContainer().createScope(),
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

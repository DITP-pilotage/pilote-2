import { asClass, AwilixContainer, ContainerOptions, createContainer, InjectionMode, Lifetime } from 'awilix';
import {
  getParametrageIndicateurContainer,
  ParametrageIndicateurDependencies,
} from '@/server/parametrage-indicateur/container';
import { ChantierDependencies, getChantiersContainer } from '@/server/chantiers/container';
import { getImportIndicateurContainer, ImportIndicateurDependencies } from '@/server/import-indicateur/container';
import { AuthentificationDependencies, getAuthentificationContainer } from '@/server/authentification/container';
import { FicheConducteurDependencies, getFicheConducteurContainer } from '@/server/fiche-conducteur/container';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import { GestionUtilisateurDependencies, getGestionUtilisateurContainer } from './gestion-utilisateur/container';

interface InitialDependencies {
  prisma: PrismaPilote
}

export type ContainerDependencies = {
  authentification: AwilixContainer<AuthentificationDependencies>
  chantiers: AwilixContainer<ChantierDependencies>,
  parametrageIndicateur: AwilixContainer<ParametrageIndicateurDependencies>
  importIndicateur: AwilixContainer<ImportIndicateurDependencies>
  gestionUtilisateur: AwilixContainer<GestionUtilisateurDependencies>
  ficheConducteur: AwilixContainer<FicheConducteurDependencies>
  main: AwilixContainer<InitialDependencies>
};

function registerContainer(): ContainerDependencies {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };

  const initialContainer = createContainer<InitialDependencies>(defaultOptions);

  initialContainer.register({
    prisma: asClass(PrismaPilote, { lifetime: Lifetime.SINGLETON }),
  });

  return {
    authentification: getAuthentificationContainer().createScope(),
    chantiers: getChantiersContainer().createScope(),
    parametrageIndicateur: getParametrageIndicateurContainer().createScope(),
    importIndicateur: getImportIndicateurContainer().createScope(),
    gestionUtilisateur: getGestionUtilisateurContainer().createScope(),
    ficheConducteur: getFicheConducteurContainer(initialContainer),
    main: initialContainer.createScope(),
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

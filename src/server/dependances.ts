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
import { getParametrageNouveautesContainer, ParametrageNouveautesDependencies } from './parametrage-nouveautes/container';

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
  parametrageNouveautes: AwilixContainer<ParametrageNouveautesDependencies>
  main: AwilixContainer<InitialDependencies>
};

function registerContainer(): ContainerDependencies {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };

  const initialContainer = createContainer<InitialDependencies>(defaultOptions);

  initialContainer.register({
    prisma: asClass(PrismaPilote, { lifetime: Lifetime.SINGLETON }),
  });

  return {
    main: initialContainer.createScope(),
    authentification: getAuthentificationContainer(initialContainer),
    chantiers: getChantiersContainer(initialContainer),
    parametrageIndicateur: getParametrageIndicateurContainer(initialContainer),
    importIndicateur: getImportIndicateurContainer(initialContainer),
    gestionUtilisateur: getGestionUtilisateurContainer(initialContainer),
    ficheConducteur: getFicheConducteurContainer(initialContainer),
    parametrageNouveautes: getParametrageNouveautesContainer(initialContainer),
  };
}

let innerContainer: ContainerDependencies;

declare global {
  var __container: ContainerDependencies | undefined;
}

if (!global.__container) {
  global.__container = registerContainer();
}
innerContainer = global.__container;

export const getContainer = <T extends keyof ContainerDependencies>(nameDependency: T) => innerContainer[nameDependency];

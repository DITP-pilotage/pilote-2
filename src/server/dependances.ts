import { AwilixContainer, asClass, createContainer, InjectionMode, ContainerOptions } from 'awilix';
import { RecupererDonneesChantierQuery } from '@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { PrismaChantierRepository } from '@/server/chantiers/infrastructure/adapters/PrismaChantierRepository';
import {
  ImportMasseMetadataIndicateurHandler,
} from '@/server/parametrage-indicateur/infrastructure/handlers/ImportMasseMetadataIndicateurHandler';
import ImportMasseMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/ImportMasseMetadataIndicateurUseCase';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import {
  PrismaMetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/infrastructure/adapters/PrismaMetadataParametrageIndicateurRepository';

type ChantierDependencies = {
  chantierRepository: ChantierRepository
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery
};

type ParametrageIndicateurDependencies = {
  importMasseMetadataIndicateurHandler: ImportMasseMetadataIndicateurHandler
  importMasseMetadataIndicateurUseCase: ImportMasseMetadataIndicateurUseCase
  metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository
};

export type ContainerDependencies = {
  chantier: AwilixContainer<ChantierDependencies>,
  parametrageIndicateur: AwilixContainer<ParametrageIndicateurDependencies>
};

let innerContainer: ContainerDependencies;

declare global {
  var __container: ContainerDependencies | undefined;
}

function registerContainer(): ContainerDependencies {
  // On pourra utiliser plus tard des registers provenant des sous dossiers pour plus de lisibilité
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY };
  
  const chantier = createContainer<ChantierDependencies>(defaultOptions);
  const parametrageIndicateurDependencies = createContainer<ParametrageIndicateurDependencies>(defaultOptions);

  chantier.register({
    chantierRepository: asClass(PrismaChantierRepository),
    recupererDonneesChantierQuery: asClass(RecupererDonneesChantierQuery),
  });

  parametrageIndicateurDependencies.register({
    importMasseMetadataIndicateurHandler: asClass(ImportMasseMetadataIndicateurHandler),
    importMasseMetadataIndicateurUseCase: asClass(ImportMasseMetadataIndicateurUseCase),
    metadataParametrageIndicateurRepository: asClass(PrismaMetadataParametrageIndicateurRepository),
  });

  return {
    chantier: chantier.createScope(),
    parametrageIndicateur: parametrageIndicateurDependencies.createScope(),
  };
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

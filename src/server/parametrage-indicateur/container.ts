import { asClass, AwilixContainer, ContainerOptions, createContainer, InjectionMode } from 'awilix';
import {
  InformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/ports/InformationMetadataIndicateurRepository';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import CreerUneMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/CreerUneMetadataIndicateurUseCase';
import ModifierUneMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/ModifierUneMetadataIndicateurUseCase';
import InitialiserNouvelIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/InitialiserNouvelIndicateurUseCase';
import RécupérerInformationMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/RécupérerInformationMetadataIndicateurUseCase';
import RécupérerListeMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/RécupérerListeMetadataIndicateurUseCase';
import RécupérerMetadataIndicateurIdentifiantGénéréUseCase
  from '@/server/parametrage-indicateur/usecases/RécupérerMetadataIndicateurIdentifiantGénéréUseCase';
import RécupérerUnIndicateurUseCase from '@/server/parametrage-indicateur/usecases/RécupérerUnIndicateurUseCase';
import {
  ImportMasseMetadataIndicateurHandler,
} from '@/server/parametrage-indicateur/infrastructure/handlers/ImportMasseMetadataIndicateurHandler';
import ImportMasseMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/ImportMasseMetadataIndicateurUseCase';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import {
  PrismaHistorisationModificationRepository,
} from '@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository';
import {
  YamlInformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/infrastructure/adapters/YamlInformationMetadataIndicateurRepository';
import {
  PrismaMetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/infrastructure/adapters/PrismaMetadataParametrageIndicateurRepository';

export type ParametrageIndicateurDependencies = {
  informationMetadataIndicateurRepository: InformationMetadataIndicateurRepository,
  historisationModificationRepository: HistorisationModificationRepository,
  creerUneMetadataIndicateurUseCase: CreerUneMetadataIndicateurUseCase,
  modifierUneMetadataIndicateurUseCase: ModifierUneMetadataIndicateurUseCase,
  initialiserNouvelIndicateurUseCase: InitialiserNouvelIndicateurUseCase,
  récupérerInformationMetadataIndicateurUseCase: RécupérerInformationMetadataIndicateurUseCase,
  récupérerListeMetadataIndicateurUseCase: RécupérerListeMetadataIndicateurUseCase,
  récupérerMetadataIndicateurIdentifiantGénéréUseCase: RécupérerMetadataIndicateurIdentifiantGénéréUseCase,
  récupérerUnIndicateurUseCase: RécupérerUnIndicateurUseCase,
  importMasseMetadataIndicateurHandler: ImportMasseMetadataIndicateurHandler
  importMasseMetadataIndicateurUseCase: ImportMasseMetadataIndicateurUseCase
  metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository
};
export const getParametrageIndicateurContainer = (): AwilixContainer<ParametrageIndicateurDependencies> => {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };

  const parametrageIndicateurDependencies = createContainer<ParametrageIndicateurDependencies>(defaultOptions);

  return parametrageIndicateurDependencies.register({
    historisationModificationRepository: asClass(PrismaHistorisationModificationRepository),
    informationMetadataIndicateurRepository: asClass(YamlInformationMetadataIndicateurRepository),
    creerUneMetadataIndicateurUseCase: asClass(CreerUneMetadataIndicateurUseCase),
    modifierUneMetadataIndicateurUseCase: asClass(ModifierUneMetadataIndicateurUseCase),
    initialiserNouvelIndicateurUseCase: asClass(InitialiserNouvelIndicateurUseCase),
    récupérerInformationMetadataIndicateurUseCase: asClass(RécupérerInformationMetadataIndicateurUseCase),
    récupérerListeMetadataIndicateurUseCase: asClass(RécupérerListeMetadataIndicateurUseCase),
    récupérerMetadataIndicateurIdentifiantGénéréUseCase: asClass(RécupérerMetadataIndicateurIdentifiantGénéréUseCase),
    récupérerUnIndicateurUseCase: asClass(RécupérerUnIndicateurUseCase),
    importMasseMetadataIndicateurHandler: asClass(ImportMasseMetadataIndicateurHandler),
    importMasseMetadataIndicateurUseCase: asClass(ImportMasseMetadataIndicateurUseCase),
    metadataParametrageIndicateurRepository: asClass(PrismaMetadataParametrageIndicateurRepository),
  });
};

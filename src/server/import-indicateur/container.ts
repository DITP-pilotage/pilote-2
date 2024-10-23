import { asClass, AwilixContainer, ContainerOptions, createContainer, InjectionMode } from 'awilix';
import {
  PublierFichierImportIndicateurHandler,
} from '@/server/import-indicateur/infrastructure/handlers/PublierIndicateurHandler';
import {
  PublierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import {
  PrismaMesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaMesureIndicateurTemporaireRepository';
import {
  MesureIndicateurRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';
import {
  PrismaMesureIndicateurRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaMesureIndicateurRepository';
import {
  VerifierFichierImportIndicateurHandler,
} from '@/server/import-indicateur/infrastructure/handlers/VerifierImportIndicateurHandler';
import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import {
  ValidataFichierIndicateurValidationService,
} from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';
import {
  ErreurValidationFichierRepository,
} from '@/server/import-indicateur/domain/ports/ErreurValidationFichierRepository';
import {
  PrismaErreurValidationFichierRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaErreurValidationFichierRepository';
import { IndicateurRepository } from '@/server/import-indicateur/domain/ports/IndicateurRepository';
import {
  PrismaIndicateurRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaIndicateurRepository';
import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';
import {
  VerifierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase';
import { FetchHttpClient } from '@/server/import-indicateur/infrastructure/adapters/FetchHttpClient';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient.interface';
import {
  ImportDonneeIndicateurAPIHandler,
} from '@/server/import-indicateur/infrastructure/handlers/ImportDonneeIndicateurAPIHandler';

export type ImportIndicateurDependencies = {
  httpClient: HttpClient
  publierFichierImportIndicateurHandler: PublierFichierImportIndicateurHandler
  publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase
  mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository
  mesureIndicateurRepository: MesureIndicateurRepository
  verifierFichierImportIndicateurHandler: VerifierFichierImportIndicateurHandler
  verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase
  fichierIndicateurValidationService: FichierIndicateurValidationService
  erreurValidationFichierRepository: ErreurValidationFichierRepository
  indicateurRepository: IndicateurRepository
  rapportRepository: RapportRepository
  importDonneeIndicateurAPIHandler: ImportDonneeIndicateurAPIHandler
};
export const getImportIndicateurContainer = (): AwilixContainer<ImportIndicateurDependencies> => {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };

  const importIndicateur = createContainer<ImportIndicateurDependencies>(defaultOptions);

  return importIndicateur.register({
    httpClient: asClass(FetchHttpClient),
    publierFichierImportIndicateurHandler: asClass(PublierFichierImportIndicateurHandler),
    publierFichierIndicateurImporteUseCase: asClass(PublierFichierIndicateurImporteUseCase),
    mesureIndicateurTemporaireRepository: asClass(PrismaMesureIndicateurTemporaireRepository),
    mesureIndicateurRepository: asClass(PrismaMesureIndicateurRepository),
    verifierFichierImportIndicateurHandler: asClass(VerifierFichierImportIndicateurHandler),
    verifierFichierIndicateurImporteUseCase: asClass(VerifierFichierIndicateurImporteUseCase),
    fichierIndicateurValidationService: asClass(ValidataFichierIndicateurValidationService),
    erreurValidationFichierRepository: asClass(PrismaErreurValidationFichierRepository),
    indicateurRepository: asClass(PrismaIndicateurRepository),
    rapportRepository: asClass(PrismaRapportRepository),
    importDonneeIndicateurAPIHandler: asClass(ImportDonneeIndicateurAPIHandler),
  });
};

import { asClass, AwilixContainer, ContainerOptions, createContainer, InjectionMode } from 'awilix';
import UtilisateurRepository from './domain/ports/UtilisateurRepository.interface';
import { UtilisateurIAMRepository } from './domain/ports/UtilisateurIAMRepository';
import { TokenAPIInformationRepository } from './domain/ports/TokenAPIInformationRepository';
import DesactiverUnUtilisateurUseCase from './usecases/DesactiverUnUtilisateurUseCase';
import { UtilisateurSQLRepository } from './infrastructure/adapters/UtilisateurSQLRepository';
import { UtilisateurIAMKeycloakRepository } from './infrastructure/adapters/UtilisateurIAMKeycloakRepository';
import { PrismaTokenAPIInformationRepository } from './infrastructure/adapters/PrismaTokenAPIInformationRepository';
import ReactiverUnUtilisateurUseCase from './usecases/ReactiverUnUtilisateurUseCase';

export type GestionUtilisateurDependencies = {
  utilisateurRepository: UtilisateurRepository
  utilisateurIAMRepository: UtilisateurIAMRepository
  tokenAPIInformationRepository: TokenAPIInformationRepository
  desactiverUnUtilisateurUseCase: DesactiverUnUtilisateurUseCase
  reactiverUnUtilisateurUseCase: ReactiverUnUtilisateurUseCase
};
export const getGestionUtilisateurContainer = (): AwilixContainer<GestionUtilisateurDependencies> => {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };

  const gestionUtilisateur = createContainer<GestionUtilisateurDependencies>(defaultOptions);
  
  return gestionUtilisateur.register({
    utilisateurRepository: asClass(UtilisateurSQLRepository),
    utilisateurIAMRepository: asClass(UtilisateurIAMKeycloakRepository),
    tokenAPIInformationRepository: asClass(PrismaTokenAPIInformationRepository),
    desactiverUnUtilisateurUseCase: asClass(DesactiverUnUtilisateurUseCase),
    reactiverUnUtilisateurUseCase: asClass(ReactiverUnUtilisateurUseCase),
  });
};

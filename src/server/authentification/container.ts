import { asClass, AwilixContainer, ContainerOptions, createContainer, InjectionMode } from 'awilix';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository';

export type AuthentificationDependencies = {
  utilisateurRepository: UtilisateurRepository
};
export const getAuthentificationContainer = (): AwilixContainer<AuthentificationDependencies> => {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };

  const chantier = createContainer<AuthentificationDependencies>(defaultOptions);

  return chantier.register({
    utilisateurRepository: asClass(UtilisateurSQLRepository),
  });
};

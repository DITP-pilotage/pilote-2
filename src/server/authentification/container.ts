import { asClass, AwilixContainer } from 'awilix';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/utilisateur/PrismaUtilisateurRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';

export type AuthentificationDependencies = {
  utilisateurRepository: UtilisateurRepository
};

export const getAuthentificationContainer = (initialContainer: AwilixContainer<{ prisma: PrismaPilote }>): AwilixContainer<AuthentificationDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<AuthentificationDependencies>().register({
    utilisateurRepository: asClass(UtilisateurSQLRepository),
  });
};

import { asClass, AwilixContainer } from "awilix";
import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { PrismaProfilUtilisateurRepository } from "@/server/profil-utilisateur/infrastructure/adapters/PrismaProfilUtilisateurRepository";
import { ModifierMonProfilUseCase } from "@/server/profil-utilisateur/usecases/ModifierMonProfilUseCase";
import { GetProfilUtilisateurQuery } from "@/server/profil-utilisateur/queries/GetProfilUtilisateurQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ProfilUtilisateurDependencies = {
  profilUtilisateurRepository: ProfilUtilisateurRepository;
  modifierMonProfilUseCase: ModifierMonProfilUseCase;
  getProfilUtilisateurQuery: GetProfilUtilisateurQuery;
};

export const getProfilUtilisateurContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<
  ProfilUtilisateurDependencies & { prisma: PrismaPilote }
> => {
  return initialContainer
    .createScope<ProfilUtilisateurDependencies>()
    .register({
      profilUtilisateurRepository: asClass(PrismaProfilUtilisateurRepository),
      modifierMonProfilUseCase: asClass(ModifierMonProfilUseCase),
      getProfilUtilisateurQuery: asClass(GetProfilUtilisateurQuery),
    });
};

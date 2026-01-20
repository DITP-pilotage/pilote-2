import { asClass, asFunction, AwilixContainer } from "awilix";
import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { PrismaProfilUtilisateurRepository } from "@/server/profil-utilisateur/infrastructure/adapters/PrismaProfilUtilisateurRepository";
import { ModifierMonProfilUseCase } from "@/server/profil-utilisateur/usecases/ModifierMonProfilUseCase";
import { GetProfilUtilisateurQuery } from "@/server/profil-utilisateur/queries/GetProfilUtilisateurQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ProfilModifieSideEffects } from "@/server/profil-utilisateur/domain/ports/ProfilModifieSideEffects";
import { KeycloakBrevoProfilModifieSideEffects } from "@/server/profil-utilisateur/infrastructure/adapters/KeycloakBrevoProfilModifieSideEffects";
import { EmailManager } from "@/server/infrastructure/email-manager/EmailManager";
import { configuration } from "@/config";

export type ProfilUtilisateurDependencies = {
  profilUtilisateurRepository: ProfilUtilisateurRepository;
  profilModifieSideEffects: ProfilModifieSideEffects;
  modifierMonProfilUseCase: ModifierMonProfilUseCase;
  getProfilUtilisateurQuery: GetProfilUtilisateurQuery;
};

export const getProfilUtilisateurContainer = (
  initialContainer: AwilixContainer<{
    prisma: PrismaPilote;
    emailManager: EmailManager;
  }>,
): AwilixContainer<
  ProfilUtilisateurDependencies & {
    prisma: PrismaPilote;
    emailManager: EmailManager;
  }
> => {
  return initialContainer
    .createScope<ProfilUtilisateurDependencies>()
    .register({
      profilUtilisateurRepository: asClass(PrismaProfilUtilisateurRepository),
      profilModifieSideEffects: asFunction(({ emailManager }) => {
        const config = configuration();
        return new KeycloakBrevoProfilModifieSideEffects({
          emailManager,
          keycloakUrl: config.import.keycloakUrl,
          keycloakClientId: config.import.clientId,
          keycloakClientSecret: config.import.clientSecret,
        });
      }),
      modifierMonProfilUseCase: asClass(ModifierMonProfilUseCase),
      getProfilUtilisateurQuery: asClass(GetProfilUtilisateurQuery),
    });
};

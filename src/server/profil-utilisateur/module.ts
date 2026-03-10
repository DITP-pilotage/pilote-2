import { asClass } from "awilix";
import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { PrismaProfilUtilisateurRepository } from "@/server/profil-utilisateur/infrastructure/adapters/PrismaProfilUtilisateurRepository";
import { ModifierMonProfilUseCase } from "@/server/profil-utilisateur/usecases/ModifierMonProfilUseCase";
import { GetProfilUtilisateurQuery } from "@/server/profil-utilisateur/queries/GetProfilUtilisateurQuery";
import { ProfilModifieSideEffects } from "@/server/profil-utilisateur/domain/ports/ProfilModifieSideEffects";
import { KeycloakBrevoProfilModifieSideEffects } from "@/server/profil-utilisateur/infrastructure/adapters/KeycloakBrevoProfilModifieSideEffects";
import type { EmailManager } from "@/server/infrastructure/email-manager/EmailManager";
import { configuration } from "@/config";
import { defineModule } from "@/server/module-system";

type ProfilUtilisateurExports = Record<string, never>;

type ProfilUtilisateurCradle = ProfilUtilisateurExports & {
  profilUtilisateurRepository: ProfilUtilisateurRepository;
  profilModifieSideEffects: ProfilModifieSideEffects;
  modifierMonProfilUseCase: ModifierMonProfilUseCase;
  getProfilUtilisateurQuery: GetProfilUtilisateurQuery;
  emailManager: EmailManager;
};

export type ProfilUtilisateurDependencies = ProfilUtilisateurCradle;

export const profilUtilisateurModule = defineModule<
  "profilUtilisateur",
  ProfilUtilisateurExports,
  ProfilUtilisateurCradle
>({
  name: "profilUtilisateur",
  imports: ["shared"],
  exports: [],
  register: (container, fn) => {
    container.register({
      profilUtilisateurRepository: asClass(PrismaProfilUtilisateurRepository),
      profilModifieSideEffects: fn(({ emailManager }) => {
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
  },
});

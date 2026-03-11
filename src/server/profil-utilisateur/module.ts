import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { PrismaProfilUtilisateurRepository } from "@/server/profil-utilisateur/infrastructure/adapters/PrismaProfilUtilisateurRepository";
import { ModifierMonProfilUseCase } from "@/server/profil-utilisateur/usecases/ModifierMonProfilUseCase";
import { GetProfilUtilisateurQuery } from "@/server/profil-utilisateur/queries/GetProfilUtilisateurQuery";
import { ProfilModifieSideEffects } from "@/server/profil-utilisateur/domain/ports/ProfilModifieSideEffects";
import { KeycloakBrevoProfilModifieSideEffects } from "@/server/profil-utilisateur/infrastructure/adapters/KeycloakBrevoProfilModifieSideEffects";
import type { EmailManager } from "@/server/infrastructure/email-manager/EmailManager";
import { configuration } from "@/config";
import {
  defineModule,
  type ModuleScope,
  type NoExports,
} from "@/server/module-system";

type ProfilUtilisateurCradle = NoExports & {
  profilUtilisateurRepository: ProfilUtilisateurRepository;
  profilModifieSideEffects: ProfilModifieSideEffects;
  modifierMonProfilUseCase: ModifierMonProfilUseCase;
  getProfilUtilisateurQuery: GetProfilUtilisateurQuery;
  emailManager: EmailManager;
};

export const profilUtilisateurModule = defineModule<
  NoExports,
  ProfilUtilisateurCradle
>()({
  name: "profilUtilisateur",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      profilUtilisateurRepository: asModuleClass(
        PrismaProfilUtilisateurRepository,
      ),
      profilModifieSideEffects: asModuleFunction(({ emailManager }) => {
        const config = configuration();
        return new KeycloakBrevoProfilModifieSideEffects({
          emailManager,
          keycloakUrl: config.import.keycloakUrl,
          keycloakClientId: config.import.clientId,
          keycloakClientSecret: config.import.clientSecret,
        });
      }),
      modifierMonProfilUseCase: asModuleClass(ModifierMonProfilUseCase),
      getProfilUtilisateurQuery: asModuleClass(GetProfilUtilisateurQuery),
    });
  },
});

type Scope = ModuleScope<ProfilUtilisateurCradle>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

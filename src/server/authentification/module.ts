import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import { UtilisateurSQLRepository } from "@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
} from "@/server/module-system";

type AuthentificationCradle = {
  utilisateurRepository: UtilisateurRepository;
};

export const authentificationModule = defineModule<
  NoExports,
  AuthentificationCradle
>()({
  name: "authentification",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      utilisateurRepository: asModuleClass(UtilisateurSQLRepository),
    } satisfies Record<keyof AuthentificationCradle, unknown>);
  },
});

type Scope = ExtractScope<typeof authentificationModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

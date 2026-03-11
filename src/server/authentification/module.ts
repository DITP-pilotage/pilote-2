import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import { UtilisateurSQLRepository } from "@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository";
import {
  defineModule,
  type ModuleScope,
  type NoExports,
} from "@/server/module-system";

type AuthentificationCradle = NoExports & {
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
    });
  },
});

type Scope = ModuleScope<AuthentificationCradle>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

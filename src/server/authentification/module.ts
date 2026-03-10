import { asClass } from "awilix";
import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import { UtilisateurSQLRepository } from "@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository";
import { defineModule } from "@/server/module-system";

type AuthentificationExports = Record<string, never>;

type AuthentificationCradle = AuthentificationExports & {
  utilisateurRepository: UtilisateurRepository;
};

export type AuthentificationDependencies = AuthentificationCradle;

export const authentificationModule = defineModule<
  "authentification",
  AuthentificationExports,
  AuthentificationCradle
>({
  name: "authentification",
  imports: ["shared"],
  exports: [],
  register: (container) => {
    container.register({
      utilisateurRepository: asClass(UtilisateurSQLRepository),
    });
  },
});

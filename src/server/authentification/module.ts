import { asClass } from "awilix";
import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import { UtilisateurSQLRepository } from "@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository";
import { defineModule, type NoExports } from "@/server/module-system";

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
  register: (container) => {
    container.register({
      utilisateurRepository: asClass(UtilisateurSQLRepository),
    });
  },
});

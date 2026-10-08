import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import ProfilRepository from "@/server/domain/profil/ProfilRepository";
import { UtilisateurRepository as UtilisateurAPIRepository } from "@/server/authentification/domain/ports/UtilisateurRepository";
import { ProfilRepository as ProfilAPIRepository } from "@/server/authentification/domain/ports/ProfilRepository";
import { TokenAPIService } from "@/server/authentification/domain/ports/TokenAPIService";
import { TokenAPIInformationRepository } from "@/server/authentification/domain/ports/TokenAPIInformationRepository";
import { UtilisateurSQLRepository } from "@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository";
import ProfilSQLRepository from "@/server/infrastructure/accès_données/profil/ProfilSQLRepository";
import { PrismaUtilisateurRepository } from "@/server/authentification/infrastructure/adapters/PrismaUtilisateurRepository";
import { PrismaProfilRepository } from "@/server/authentification/infrastructure/adapters/PrismaProfilRepository";
import { PrismaTokenAPIInformationRepository } from "@/server/authentification/infrastructure/adapters/PrismaTokenAPIInformationRepository";
import { TokenAPIJWTService } from "@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService";
import { UtilisateurAuthentifieJWTService } from "@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService";
import { CreerTokenAPIUseCase } from "@/server/authentification/usecases/CreerTokenAPIUseCase";
import { ListerTokenAPIInformationUseCase } from "@/server/authentification/usecases/ListerTokenAPIInformationUseCase";
import { RecupererTokenAPIInformationUseCase } from "@/server/authentification/usecases/RecupererTokenAPIInformationUseCase";
import { SupprimerTokenAPIUseCase } from "@/server/authentification/usecases/SupprimerTokenAPIUseCase";
import { configuration } from "@/config";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";

type AuthentificationCradle = {
  utilisateurRepository: UtilisateurRepository;
  profilRepository: ProfilRepository;
  utilisateurAPIRepository: UtilisateurAPIRepository;
  profilAPIRepository: ProfilAPIRepository;
  tokenAPIService: TokenAPIService;
  tokenAPIInformationRepository: TokenAPIInformationRepository;
  utilisateurAuthentifieJWTService: UtilisateurAuthentifieJWTService;
  creerTokenAPIUseCase: CreerTokenAPIUseCase;
  listerTokenAPIInformationUseCase: ListerTokenAPIInformationUseCase;
  recupererTokenAPIInformationUseCase: RecupererTokenAPIInformationUseCase;
  supprimerTokenAPIUseCase: SupprimerTokenAPIUseCase;
};

export const authentificationModule = defineModule<
  NoExports,
  AuthentificationCradle
>()({
  name: "authentification",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass, asModuleFunction }) => {
    container.register({
      utilisateurRepository: asModuleClass(UtilisateurSQLRepository).scoped(),
      profilRepository: asModuleClass(ProfilSQLRepository).scoped(),
      utilisateurAPIRepository: asModuleClass(
        PrismaUtilisateurRepository,
      ).scoped(),
      profilAPIRepository: asModuleClass(PrismaProfilRepository).scoped(),
      tokenAPIService: asModuleFunction(
        () =>
          new TokenAPIJWTService({ secret: configuration().tokenAPI.secret }),
      ).scoped(),
      tokenAPIInformationRepository: asModuleClass(
        PrismaTokenAPIInformationRepository,
      ).scoped(),
      utilisateurAuthentifieJWTService: asModuleFunction(
        ({
          utilisateurRepository,
          tokenAPIInformationRepository,
          profilAPIRepository,
        }) =>
          new UtilisateurAuthentifieJWTService({
            utilisateurRepository,
            tokenAPIRepository: tokenAPIInformationRepository,
            profilRepository: profilAPIRepository,
          }),
      ).scoped(),
      creerTokenAPIUseCase: asModuleFunction(
        ({
          tokenAPIService,
          tokenAPIInformationRepository,
          utilisateurAPIRepository,
        }) =>
          new CreerTokenAPIUseCase({
            tokenAPIService,
            tokenAPIInformationRepository,
            utilisateurRepository: utilisateurAPIRepository,
          }),
      ).scoped(),
      listerTokenAPIInformationUseCase: asModuleClass(
        ListerTokenAPIInformationUseCase,
      ).scoped(),
      recupererTokenAPIInformationUseCase: asModuleClass(
        RecupererTokenAPIInformationUseCase,
      ).scoped(),
      supprimerTokenAPIUseCase: asModuleClass(
        SupprimerTokenAPIUseCase,
      ).scoped(),
    } satisfies VerifyCradle<AuthentificationCradle>);
  },
});

type Scope = ExtractScope<typeof authentificationModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

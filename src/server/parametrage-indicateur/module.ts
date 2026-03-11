import { HistorisationModificationRepository } from "@/server/domain/historisationModification/HistorisationModificationRepository";
import CreerUneMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/CreerUneMetadataIndicateurUseCase";
import ModifierUneMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/ModifierUneMetadataIndicateurUseCase";
import InitialiserNouvelIndicateurUseCase from "@/server/parametrage-indicateur/usecases/InitialiserNouvelIndicateurUseCase";
import RécupérerInformationMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/RécupérerInformationMetadataIndicateurUseCase";
import RécupérerListeMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/RécupérerListeMetadataIndicateurUseCase";
import RécupérerMetadataIndicateurIdentifiantGénéréUseCase from "@/server/parametrage-indicateur/usecases/RécupérerMetadataIndicateurIdentifiantGénéréUseCase";
import RécupérerUnIndicateurUseCase from "@/server/parametrage-indicateur/usecases/RécupérerUnIndicateurUseCase";
import { ImportMasseMetadataIndicateurHandler } from "@/server/parametrage-indicateur/infrastructure/handlers/ImportMasseMetadataIndicateurHandler";
import ImportMasseMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/ImportMasseMetadataIndicateurUseCase";
import { MetadataParametrageIndicateurRepository } from "@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository";
import { PrismaHistorisationModificationRepository } from "@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository";
import { PrismaMetadataParametrageIndicateurRepository } from "@/server/parametrage-indicateur/infrastructure/adapters/PrismaMetadataParametrageIndicateurRepository";
import { PrismaMetadataParametrageIndicateurQuery } from "@/server/parametrage-indicateur/infrastructure/queries/PrismaMetadataParametrageIndicateurQuery";
import { GetMetadataIndicateurConfigurationQuery } from "@/server/parametrage-indicateur/queries/GetMetadataIndicateurConfigurationQuery";
import { EnregistrerMetadataIndicateurHandler } from "@/server/parametrage-indicateur/handlers/EnregistrerMetadataIndicateurHandler";
import {
  defineModule,
  type ModuleScope,
  type NoExports,
} from "@/server/module-system";

type ParametrageIndicateurCradle = NoExports & {
  historisationModificationRepository: HistorisationModificationRepository;
  creerUneMetadataIndicateurUseCase: CreerUneMetadataIndicateurUseCase;
  modifierUneMetadataIndicateurUseCase: ModifierUneMetadataIndicateurUseCase;
  initialiserNouvelIndicateurUseCase: InitialiserNouvelIndicateurUseCase;
  récupérerInformationMetadataIndicateurUseCase: RécupérerInformationMetadataIndicateurUseCase;
  récupérerListeMetadataIndicateurUseCase: RécupérerListeMetadataIndicateurUseCase;
  récupérerMetadataIndicateurIdentifiantGénéréUseCase: RécupérerMetadataIndicateurIdentifiantGénéréUseCase;
  récupérerUnIndicateurUseCase: RécupérerUnIndicateurUseCase;
  importMasseMetadataIndicateurHandler: ImportMasseMetadataIndicateurHandler;
  importMasseMetadataIndicateurUseCase: ImportMasseMetadataIndicateurUseCase;
  metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;
  metadataParametrageIndicateurQuery: PrismaMetadataParametrageIndicateurQuery;
  getMetadataIndicateurConfigurationQuery: GetMetadataIndicateurConfigurationQuery;
  enregistrerMetadataIndicateurHandler: EnregistrerMetadataIndicateurHandler;
};

export const parametrageIndicateurModule = defineModule<
  NoExports,
  ParametrageIndicateurCradle
>()({
  name: "parametrageIndicateur",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      historisationModificationRepository: asModuleClass(
        PrismaHistorisationModificationRepository,
      ),
      creerUneMetadataIndicateurUseCase: asModuleClass(
        CreerUneMetadataIndicateurUseCase,
      ),
      modifierUneMetadataIndicateurUseCase: asModuleClass(
        ModifierUneMetadataIndicateurUseCase,
      ),
      initialiserNouvelIndicateurUseCase: asModuleClass(
        InitialiserNouvelIndicateurUseCase,
      ),
      récupérerInformationMetadataIndicateurUseCase: asModuleClass(
        RécupérerInformationMetadataIndicateurUseCase,
      ),
      récupérerListeMetadataIndicateurUseCase: asModuleClass(
        RécupérerListeMetadataIndicateurUseCase,
      ),
      récupérerMetadataIndicateurIdentifiantGénéréUseCase: asModuleClass(
        RécupérerMetadataIndicateurIdentifiantGénéréUseCase,
      ),
      récupérerUnIndicateurUseCase: asModuleClass(RécupérerUnIndicateurUseCase),
      importMasseMetadataIndicateurHandler: asModuleClass(
        ImportMasseMetadataIndicateurHandler,
      ),
      importMasseMetadataIndicateurUseCase: asModuleClass(
        ImportMasseMetadataIndicateurUseCase,
      ),
      metadataParametrageIndicateurRepository: asModuleClass(
        PrismaMetadataParametrageIndicateurRepository,
      ),
      metadataParametrageIndicateurQuery: asModuleClass(
        PrismaMetadataParametrageIndicateurQuery,
      ),
      getMetadataIndicateurConfigurationQuery: asModuleClass(
        GetMetadataIndicateurConfigurationQuery,
      ),
      enregistrerMetadataIndicateurHandler: asModuleClass(
        EnregistrerMetadataIndicateurHandler,
      ),
    });
  },
});

type Scope = ModuleScope<ParametrageIndicateurCradle>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

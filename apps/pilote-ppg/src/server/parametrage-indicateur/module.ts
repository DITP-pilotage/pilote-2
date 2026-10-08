import { HistorisationModificationRepository } from "@/server/historisation-modification/domain/HistorisationModificationRepository";
import CreerUneMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/CreerUneMetadataIndicateurUseCase";
import ModifierUneMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/ModifierUneMetadataIndicateurUseCase";
import InitialiserNouvelIndicateurUseCase from "@/server/parametrage-indicateur/usecases/InitialiserNouvelIndicateurUseCase";
import RecupererInformationMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/RecupererInformationMetadataIndicateurUseCase";
import RecupererListeMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/RecupererListeMetadataIndicateurUseCase";
import RecupererMetadataIndicateurIdentifiantGenereUseCase from "@/server/parametrage-indicateur/usecases/RecupererMetadataIndicateurIdentifiantGenereUseCase";
import RecupererUnIndicateurUseCase from "@/server/parametrage-indicateur/usecases/RecupererUnIndicateurUseCase";
import { ImportMasseMetadataIndicateurHandler } from "@/server/parametrage-indicateur/infrastructure/handlers/ImportMasseMetadataIndicateurHandler";
import ImportMasseMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/ImportMasseMetadataIndicateurUseCase";
import { MetadataParametrageIndicateurRepository } from "@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository";
import { PrismaHistorisationModificationRepository } from "@/server/historisation-modification/infrastructure/PrismaHistorisationModificationRepository";
import { PrismaMetadataParametrageIndicateurRepository } from "@/server/parametrage-indicateur/infrastructure/adapters/PrismaMetadataParametrageIndicateurRepository";
import { PrismaMetadataParametrageIndicateurQuery } from "@/server/parametrage-indicateur/infrastructure/queries/PrismaMetadataParametrageIndicateurQuery";
import { GetMetadataIndicateurConfigurationQuery } from "@/server/parametrage-indicateur/queries/GetMetadataIndicateurConfigurationQuery";
import { EnregistrerMetadataIndicateurHandler } from "@/server/parametrage-indicateur/handlers/EnregistrerMetadataIndicateurHandler";
import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";

type ParametrageIndicateurExports = {
  historisationModificationRepository: HistorisationModificationRepository;
  metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;
};

type ParametrageIndicateurCradle = ParametrageIndicateurExports & {
  creerUneMetadataIndicateurUseCase: CreerUneMetadataIndicateurUseCase;
  modifierUneMetadataIndicateurUseCase: ModifierUneMetadataIndicateurUseCase;
  initialiserNouvelIndicateurUseCase: InitialiserNouvelIndicateurUseCase;
  récupérerInformationMetadataIndicateurUseCase: RecupererInformationMetadataIndicateurUseCase;
  récupérerListeMetadataIndicateurUseCase: RecupererListeMetadataIndicateurUseCase;
  récupérerMetadataIndicateurIdentifiantGénéréUseCase: RecupererMetadataIndicateurIdentifiantGenereUseCase;
  récupérerUnIndicateurUseCase: RecupererUnIndicateurUseCase;
  importMasseMetadataIndicateurHandler: ImportMasseMetadataIndicateurHandler;
  importMasseMetadataIndicateurUseCase: ImportMasseMetadataIndicateurUseCase;
  metadataParametrageIndicateurQuery: PrismaMetadataParametrageIndicateurQuery;
  getMetadataIndicateurConfigurationQuery: GetMetadataIndicateurConfigurationQuery;
  enregistrerMetadataIndicateurHandler: EnregistrerMetadataIndicateurHandler;
};

export const parametrageIndicateurModule = defineModule<
  ParametrageIndicateurExports,
  ParametrageIndicateurCradle
>()({
  name: "parametrageIndicateur",
  imports: ["framework"],
  exports: [
    "historisationModificationRepository",
    "metadataParametrageIndicateurRepository",
  ],
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
        RecupererInformationMetadataIndicateurUseCase,
      ),
      récupérerListeMetadataIndicateurUseCase: asModuleClass(
        RecupererListeMetadataIndicateurUseCase,
      ),
      récupérerMetadataIndicateurIdentifiantGénéréUseCase: asModuleClass(
        RecupererMetadataIndicateurIdentifiantGenereUseCase,
      ),
      récupérerUnIndicateurUseCase: asModuleClass(RecupererUnIndicateurUseCase),
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
    } satisfies VerifyCradle<ParametrageIndicateurCradle>);
  },
});

type Scope = ExtractScope<typeof parametrageIndicateurModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
export type { ParametrageIndicateurExports };

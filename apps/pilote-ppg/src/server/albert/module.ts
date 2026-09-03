import { ListerConversationsAdminQuery } from "@/server/albert/queries/ListerConversationsAdminQuery";
import { RecupererConversationAdminQuery } from "@/server/albert/queries/RecupererConversationAdminQuery";
import { createGetTauxAvancementTerritoireTool } from "@/server/albert/tools/getTauxAvancementTerritoire";
import { createGetChantiersTool } from "@/server/albert/tools/getChantiers";
import { createGetChantierIndicateursTool } from "@/server/albert/tools/getChantierIndicateurs";
import { createGetChantierCommentairesTool } from "@/server/albert/tools/getChantierCommentaires";
import { createGetChantierObjectifsTool } from "@/server/albert/tools/getChantierObjectifs";
import { createGetChantiersSignalesTool } from "@/server/albert/tools/getChantiersSignales";
import { createSearchChantiersTool } from "@/server/albert/tools/searchChantiers";
import { createSearchIndicateursTool } from "@/server/albert/tools/searchIndicateurs";
import { createSearchTerritoiresTool } from "@/server/albert/tools/searchTerritoires";
import { createComposeDashboardTool } from "@/server/albert/tools/composeDashboard";
import type { ChantierExports } from "@/server/chantiers/module";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import { EnregistrerConversationUseCase } from "@/server/albert/usecases/EnregistrerConversationUseCase";
import { ListerConversationsUseCase } from "@/server/albert/usecases/ListerConversationsUseCase";
import { RecupererConversationUseCase } from "@/server/albert/usecases/RecupererConversationUseCase";
import { SupprimerConversationUseCase } from "@/server/albert/usecases/SupprimerConversationUseCase";
import { PurgerConversationsExpireesUseCase } from "@/server/albert/usecases/PurgerConversationsExpireesUseCase";
import { PrismaTerritoireResolver } from "@/server/albert/infrastructure/PrismaTerritoireResolver";
import { PrismaChatConversationRepository } from "@/server/albert/infrastructure/PrismaChatConversationRepository";
import { FsRapportFileStorage } from "@/server/albert/infrastructure/FsRapportFileStorage";
import { createExportRapportTool } from "@/server/albert/tools/exportRapport";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { RapportFileStorage } from "@/server/albert/domain/RapportFileStorage";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { SharedDependencies } from "@/server/shared/module";

type AlbertImports = SharedDependencies & ChantierExports;

type AlbertOwnCradle = {
  territoireResolver: TerritoireResolver;
  rapportFileStorage: RapportFileStorage;
  createGetTauxAvancementTerritoireTool: ReturnType<
    typeof createGetTauxAvancementTerritoireTool
  >;
  createGetChantiersTool: ReturnType<typeof createGetChantiersTool>;
  createGetChantierIndicateursTool: ReturnType<
    typeof createGetChantierIndicateursTool
  >;
  createGetChantierCommentairesTool: ReturnType<
    typeof createGetChantierCommentairesTool
  >;
  createGetChantierObjectifsTool: ReturnType<
    typeof createGetChantierObjectifsTool
  >;
  createGetChantiersSignalesTool: ReturnType<
    typeof createGetChantiersSignalesTool
  >;
  createSearchChantiersTool: ReturnType<typeof createSearchChantiersTool>;
  createSearchIndicateursTool: ReturnType<typeof createSearchIndicateursTool>;
  createSearchTerritoiresTool: ReturnType<typeof createSearchTerritoiresTool>;
  createComposeDashboardTool: ReturnType<typeof createComposeDashboardTool>;
  createExportRapportTool: ReturnType<typeof createExportRapportTool>;
  evaluerChatUseCase: EvaluerChatUseCase;
  chatConversationRepository: ChatConversationRepository;
  enregistrerConversationUseCase: EnregistrerConversationUseCase;
  listerConversationsUseCase: ListerConversationsUseCase;
  recupererConversationUseCase: RecupererConversationUseCase;
  supprimerConversationUseCase: SupprimerConversationUseCase;
  purgerConversationsExpireesUseCase: PurgerConversationsExpireesUseCase;
  listerConversationsAdminQuery: ListerConversationsAdminQuery;
  recupererConversationAdminQuery: RecupererConversationAdminQuery;
};

type AlbertCradle = AlbertOwnCradle & AlbertImports;

export const albertModule = defineModule<NoExports, AlbertCradle>()({
  name: "albert",
  imports: ["shared", "chantiers"],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      territoireResolver: asModuleClass(PrismaTerritoireResolver),
      rapportFileStorage: asModuleClass(FsRapportFileStorage),
      createGetTauxAvancementTerritoireTool: asModuleFunction(
        createGetTauxAvancementTerritoireTool,
      ),
      createGetChantiersTool: asModuleFunction(createGetChantiersTool),
      createGetChantierIndicateursTool: asModuleFunction(
        createGetChantierIndicateursTool,
      ),
      createGetChantierCommentairesTool: asModuleFunction(
        createGetChantierCommentairesTool,
      ),
      createGetChantierObjectifsTool: asModuleFunction(
        createGetChantierObjectifsTool,
      ),
      createGetChantiersSignalesTool: asModuleFunction(
        createGetChantiersSignalesTool,
      ),
      createSearchChantiersTool: asModuleFunction(createSearchChantiersTool),
      createSearchIndicateursTool: asModuleFunction(
        createSearchIndicateursTool,
      ),
      createSearchTerritoiresTool: asModuleFunction(
        createSearchTerritoiresTool,
      ),
      createComposeDashboardTool: asModuleFunction(createComposeDashboardTool),
      createExportRapportTool: asModuleFunction(createExportRapportTool),
      evaluerChatUseCase: asModuleClass(EvaluerChatUseCase),
      chatConversationRepository: asModuleClass(
        PrismaChatConversationRepository,
      ),
      enregistrerConversationUseCase: asModuleClass(
        EnregistrerConversationUseCase,
      ),
      listerConversationsUseCase: asModuleClass(ListerConversationsUseCase),
      recupererConversationUseCase: asModuleClass(RecupererConversationUseCase),
      supprimerConversationUseCase: asModuleClass(SupprimerConversationUseCase),
      purgerConversationsExpireesUseCase: asModuleClass(
        PurgerConversationsExpireesUseCase,
      ),
      listerConversationsAdminQuery: asModuleClass(
        ListerConversationsAdminQuery,
      ),
      recupererConversationAdminQuery: asModuleClass(
        RecupererConversationAdminQuery,
      ),
    } satisfies VerifyCradle<AlbertOwnCradle>);
  },
});

type Scope = ExtractScope<typeof albertModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

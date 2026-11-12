import { ListerConversationsAdminQuery } from "@/server/albert/queries/ListerConversationsAdminQuery";
import { RecupererConversationAdminQuery } from "@/server/albert/queries/RecupererConversationAdminQuery";
import { ResolvePersonsQuery } from "@/server/albert/queries/ResolvePersonsQuery";
import type { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { PrismaUtilisateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaUtilisateurRepository";
import { createGetTauxAvancementTerritoireTool } from "@/server/albert/tools/getTauxAvancementTerritoire";
import { createGetChantiersTool } from "@/server/albert/tools/getChantiers";
import { createRedigerSyntheseTerritoireTool } from "@/server/albert/tools/redigerSyntheseTerritoire";
import { createRedigerComparaisonTerritoiresTool } from "@/server/albert/tools/redigerComparaisonTerritoires";
import { createRedigerSyntheseChantierTool } from "@/server/albert/tools/redigerSyntheseChantier";
import { createGetChantierIndicateursTool } from "@/server/albert/tools/getChantierIndicateurs";
import { createGetEvolutionIndicateurTool } from "@/server/albert/tools/getEvolutionIndicateur";
import { createGetHistoriqueIndicateurTool } from "@/server/albert/tools/getHistoriqueIndicateur";
import { createGetChantierCommentairesTool } from "@/server/albert/tools/getChantierCommentaires";
import { createGetChantierObjectifsTool } from "@/server/albert/tools/getChantierObjectifs";
import { createGetChantiersSignalesTool } from "@/server/albert/tools/getChantiersSignales";
import { createGetIndicateursACompleterTool } from "@/server/albert/tools/getIndicateursACompleter";
import { createSearchChantiersTool } from "@/server/albert/tools/searchChantiers";
import { createSearchIndicateursTool } from "@/server/albert/tools/searchIndicateurs";
import { createSearchTerritoiresTool } from "@/server/albert/tools/searchTerritoires";
import { createComposeDashboardTool } from "@/server/albert/tools/composeDashboard";
import { createCreateDashboardTool } from "@/server/albert/tools/createDashboard";
import type { ChantierExports } from "@/server/chantiers/module";
import type { ParametrageCentreAideExports } from "@/server/parametrage-centre-aide/module";
import { createConsulterCentreAideTool } from "@/server/albert/tools/consulterCentreAide";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import { EnregistrerConversationUseCase } from "@/server/albert/usecases/EnregistrerConversationUseCase";
import { ListerConversationsUseCase } from "@/server/albert/usecases/ListerConversationsUseCase";
import { RecupererConversationUseCase } from "@/server/albert/usecases/RecupererConversationUseCase";
import { SupprimerConversationUseCase } from "@/server/albert/usecases/SupprimerConversationUseCase";
import { PurgerConversationsExpireesUseCase } from "@/server/albert/usecases/PurgerConversationsExpireesUseCase";
import { PrismaTerritoireResolver } from "@/server/albert/infrastructure/PrismaTerritoireResolver";
import { PrismaChatConversationRepository } from "@/server/albert/infrastructure/PrismaChatConversationRepository";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { FrameworkDependencies } from "@/server/framework/module";

type AlbertImports = FrameworkDependencies &
  ChantierExports &
  ParametrageCentreAideExports;

type AlbertOwnCradle = {
  territoireResolver: TerritoireResolver;
  createGetTauxAvancementTerritoireTool: ReturnType<
    typeof createGetTauxAvancementTerritoireTool
  >;
  createGetChantiersTool: ReturnType<typeof createGetChantiersTool>;
  createRedigerSyntheseTerritoireTool: ReturnType<
    typeof createRedigerSyntheseTerritoireTool
  >;
  createRedigerComparaisonTerritoiresTool: ReturnType<
    typeof createRedigerComparaisonTerritoiresTool
  >;
  createRedigerSyntheseChantierTool: ReturnType<
    typeof createRedigerSyntheseChantierTool
  >;
  createGetChantierIndicateursTool: ReturnType<
    typeof createGetChantierIndicateursTool
  >;
  createGetEvolutionIndicateurTool: ReturnType<
    typeof createGetEvolutionIndicateurTool
  >;
  createGetHistoriqueIndicateurTool: ReturnType<
    typeof createGetHistoriqueIndicateurTool
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
  createGetIndicateursACompleterTool: ReturnType<
    typeof createGetIndicateursACompleterTool
  >;
  createSearchChantiersTool: ReturnType<typeof createSearchChantiersTool>;
  createSearchIndicateursTool: ReturnType<typeof createSearchIndicateursTool>;
  createSearchTerritoiresTool: ReturnType<typeof createSearchTerritoiresTool>;
  createComposeDashboardTool: ReturnType<typeof createComposeDashboardTool>;
  createCreateDashboardTool: ReturnType<typeof createCreateDashboardTool>;
  createConsulterCentreAideTool: ReturnType<
    typeof createConsulterCentreAideTool
  >;
  evaluerChatUseCase: EvaluerChatUseCase;
  chatConversationRepository: ChatConversationRepository;
  enregistrerConversationUseCase: EnregistrerConversationUseCase;
  listerConversationsUseCase: ListerConversationsUseCase;
  recupererConversationUseCase: RecupererConversationUseCase;
  supprimerConversationUseCase: SupprimerConversationUseCase;
  purgerConversationsExpireesUseCase: PurgerConversationsExpireesUseCase;
  listerConversationsAdminQuery: ListerConversationsAdminQuery;
  recupererConversationAdminQuery: RecupererConversationAdminQuery;
  resolvePersonsQuery: ResolvePersonsQuery;
  utilisateurRepository: UtilisateurRepository;
};

type AlbertCradle = AlbertOwnCradle & AlbertImports;

export const albertModule = defineModule<NoExports, AlbertCradle>()({
  name: "albert",
  imports: ["framework", "chantiers", "parametrageCentreAide"],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      territoireResolver: asModuleClass(PrismaTerritoireResolver),
      createGetTauxAvancementTerritoireTool: asModuleFunction(
        createGetTauxAvancementTerritoireTool,
      ),
      createGetChantiersTool: asModuleFunction(createGetChantiersTool),
      createRedigerSyntheseTerritoireTool: asModuleFunction(
        createRedigerSyntheseTerritoireTool,
      ),
      createRedigerComparaisonTerritoiresTool: asModuleFunction(
        createRedigerComparaisonTerritoiresTool,
      ),
      createRedigerSyntheseChantierTool: asModuleFunction(
        createRedigerSyntheseChantierTool,
      ),
      createGetChantierIndicateursTool: asModuleFunction(
        createGetChantierIndicateursTool,
      ),
      createGetEvolutionIndicateurTool: asModuleFunction(
        createGetEvolutionIndicateurTool,
      ),
      createGetHistoriqueIndicateurTool: asModuleFunction(
        createGetHistoriqueIndicateurTool,
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
      createGetIndicateursACompleterTool: asModuleFunction(
        createGetIndicateursACompleterTool,
      ),
      createSearchChantiersTool: asModuleFunction(createSearchChantiersTool),
      createSearchIndicateursTool: asModuleFunction(
        createSearchIndicateursTool,
      ),
      createSearchTerritoiresTool: asModuleFunction(
        createSearchTerritoiresTool,
      ),
      createComposeDashboardTool: asModuleFunction(createComposeDashboardTool),
      createCreateDashboardTool: asModuleFunction(createCreateDashboardTool),
      createConsulterCentreAideTool: asModuleFunction(
        createConsulterCentreAideTool,
      ),
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
      resolvePersonsQuery: asModuleClass(ResolvePersonsQuery),
      utilisateurRepository: asModuleClass(PrismaUtilisateurRepository),
    } satisfies VerifyCradle<AlbertOwnCradle>);
  },
});

type Scope = ExtractScope<typeof albertModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

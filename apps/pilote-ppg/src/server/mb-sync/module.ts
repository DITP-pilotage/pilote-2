import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/domain/ports/MbSyncExecutionRepository";
import { type IndicateurIdentiteRepository } from "@/server/mb-sync/domain/ports/IndicateurIdentiteRepository";
import { type IndicateurTerritoireValeurEvenementRepository } from "@/server/mb-sync/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { type MesureIndicateurObjectifRepository } from "@/server/mb-sync/domain/ports/MesureIndicateurObjectifRepository";
import { HttpMbApiClient } from "@/server/mb-sync/infrastructure/adapters/HttpMbApiClient";
import { PrismaMbSyncExecutionRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaMbSyncExecutionRepository";
import { PrismaIndicateurIdentiteRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaIndicateurIdentiteRepository";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaIndicateurTerritoireValeurEvenementRepository";
import { PrismaMesureIndicateurObjectifRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaMesureIndicateurObjectifRepository";
import { SyncMbMetadonneesUseCase } from "@/server/mb-sync/usecases/SyncMbMetadonneesUseCase";
import { SyncMbObjectifsUseCase } from "@/server/mb-sync/usecases/SyncMbObjectifsUseCase";
import { SyncMbValeursUseCase } from "@/server/mb-sync/usecases/SyncMbValeursUseCase";

export type MbSyncExports = {
  syncMbMetadonneesUseCase: SyncMbMetadonneesUseCase;
  syncMbValeursUseCase: SyncMbValeursUseCase;
  syncMbObjectifsUseCase: SyncMbObjectifsUseCase;
};

type MbSyncCradle = MbSyncExports & {
  mbApiClient: MbApiClient;
  mbSyncExecutionRepository: MbSyncExecutionRepository;
  indicateurIdentiteRepository: IndicateurIdentiteRepository;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  mesureIndicateurObjectifRepository: MesureIndicateurObjectifRepository;
};

export const mbSyncModule = defineModule<MbSyncExports, MbSyncCradle>()({
  name: "mbSync",
  imports: ["shared"],
  exports: ["syncMbMetadonneesUseCase", "syncMbValeursUseCase", "syncMbObjectifsUseCase"],
  register: (container, { asModuleClass }) => {
    container.register({
      mbApiClient: asModuleClass(HttpMbApiClient),
      mbSyncExecutionRepository: asModuleClass(PrismaMbSyncExecutionRepository),
      indicateurIdentiteRepository: asModuleClass(
        PrismaIndicateurIdentiteRepository,
      ),
      indicateurTerritoireValeurEvenementRepository: asModuleClass(
        PrismaIndicateurTerritoireValeurEvenementRepository,
      ),
      mesureIndicateurObjectifRepository: asModuleClass(
        PrismaMesureIndicateurObjectifRepository,
      ),
      syncMbMetadonneesUseCase: asModuleClass(SyncMbMetadonneesUseCase),
      syncMbValeursUseCase: asModuleClass(SyncMbValeursUseCase),
      syncMbObjectifsUseCase: asModuleClass(SyncMbObjectifsUseCase),
    } satisfies VerifyCradle<MbSyncCradle>);
  },
});

type Scope = ExtractScope<typeof mbSyncModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

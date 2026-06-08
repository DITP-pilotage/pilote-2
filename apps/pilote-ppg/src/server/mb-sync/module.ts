import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/domain/ports/MbSyncExecutionRepository";
import { type IndicateurIdentiteRepository } from "@/server/mb-sync/domain/ports/IndicateurIdentiteRepository";
import { type IndicateurTerritoireValeurEvenementRepository } from "@/server/mb-sync/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { HttpMbApiClient } from "@/server/mb-sync/infrastructure/adapters/HttpMbApiClient";
import { PrismaMbSyncExecutionRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaMbSyncExecutionRepository";
import { PrismaIndicateurIdentiteRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaIndicateurIdentiteRepository";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaIndicateurTerritoireValeurEvenementRepository";
import { SyncMbMetadonneesUseCase } from "@/server/mb-sync/usecases/SyncMbMetadonneesUseCase";
import { SyncMbValeursUseCase } from "@/server/mb-sync/usecases/SyncMbValeursUseCase";

export type MbSyncExports = {
  syncMbMetadonneesUseCase: SyncMbMetadonneesUseCase;
  syncMbValeursUseCase: SyncMbValeursUseCase;
};

type MbSyncCradle = MbSyncExports & {
  mbApiClient: MbApiClient;
  mbSyncExecutionRepository: MbSyncExecutionRepository;
  indicateurIdentiteRepository: IndicateurIdentiteRepository;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
};

export const mbSyncModule = defineModule<MbSyncExports, MbSyncCradle>()({
  name: "mbSync",
  imports: ["shared"],
  exports: ["syncMbMetadonneesUseCase", "syncMbValeursUseCase"],
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
      syncMbMetadonneesUseCase: asModuleClass(SyncMbMetadonneesUseCase),
      syncMbValeursUseCase: asModuleClass(SyncMbValeursUseCase),
    } satisfies VerifyCradle<MbSyncCradle>);
  },
});

type Scope = ExtractScope<typeof mbSyncModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

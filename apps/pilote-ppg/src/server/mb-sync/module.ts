import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { type MbIndicateurClient } from "@/server/mb-sync/domain/ports/MbIndicateurClient";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/domain/ports/MbSyncExecutionRepository";
import { HttpMbApiClient } from "@/server/mb-sync/infrastructure/adapters/HttpMbApiClient";
import { HttpMbIndicateurClient } from "@/server/mb-sync/infrastructure/adapters/HttpMbIndicateurClient";
import { PrismaMbSyncExecutionRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaMbSyncExecutionRepository";
import { SyncMbMetadonneesUseCase } from "@/server/mb-sync/usecases/SyncMbMetadonneesUseCase";
import { SyncMbValeursUseCase } from "@/server/mb-sync/usecases/SyncMbValeursUseCase";

export type MbSyncExports = {
  syncMbMetadonneesUseCase: SyncMbMetadonneesUseCase;
  syncMbValeursUseCase: SyncMbValeursUseCase;
};

type MbSyncCradle = MbSyncExports & {
  mbApiClient: MbApiClient;
  mbIndicateurClient: MbIndicateurClient;
  mbSyncExecutionRepository: MbSyncExecutionRepository;
};

export const mbSyncModule = defineModule<MbSyncExports, MbSyncCradle>()({
  name: "mbSync",
  imports: ["shared"],
  exports: ["syncMbMetadonneesUseCase", "syncMbValeursUseCase"],
  register: (container, { asModuleClass }) => {
    container.register({
      mbApiClient: asModuleClass(HttpMbApiClient),
      mbIndicateurClient: asModuleClass(HttpMbIndicateurClient),
      mbSyncExecutionRepository: asModuleClass(PrismaMbSyncExecutionRepository),
      syncMbMetadonneesUseCase: asModuleClass(SyncMbMetadonneesUseCase),
      syncMbValeursUseCase: asModuleClass(SyncMbValeursUseCase),
    } satisfies VerifyCradle<MbSyncCradle>);
  },
});

type Scope = ExtractScope<typeof mbSyncModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

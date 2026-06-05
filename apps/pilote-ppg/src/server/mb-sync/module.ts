import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/domain/ports/MbSyncExecutionRepository";
import { HttpMbApiClient } from "@/server/mb-sync/infrastructure/adapters/HttpMbApiClient";
import { PrismaMbSyncExecutionRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaMbSyncExecutionRepository";
import { SyncMbValeursUseCase } from "@/server/mb-sync/usecases/SyncMbValeursUseCase";

export type MbSyncExports = {
  syncMbValeursUseCase: SyncMbValeursUseCase;
};

type MbSyncCradle = MbSyncExports & {
  mbApiClient: MbApiClient;
  mbSyncExecutionRepository: MbSyncExecutionRepository;
};

export const mbSyncModule = defineModule<MbSyncExports, MbSyncCradle>()({
  name: "mbSync",
  imports: ["shared"],
  exports: ["syncMbValeursUseCase"],
  register: (container, { asModuleClass }) => {
    container.register({
      mbApiClient: asModuleClass(HttpMbApiClient),
      mbSyncExecutionRepository: asModuleClass(PrismaMbSyncExecutionRepository),
      syncMbValeursUseCase: asModuleClass(SyncMbValeursUseCase),
    } satisfies VerifyCradle<MbSyncCradle>);
  },
});

type Scope = ExtractScope<typeof mbSyncModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

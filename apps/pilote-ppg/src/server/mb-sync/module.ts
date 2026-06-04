import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import { MbApiClient } from "@/server/mb-sync/MbApiClient";
import { MbSyncExecutionRepository } from "@/server/mb-sync/MbSyncExecutionRepository";
import { SyncMbValeursUseCase } from "@/server/mb-sync/SyncMbValeursUseCase";

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
      mbApiClient: asModuleClass(MbApiClient),
      mbSyncExecutionRepository: asModuleClass(MbSyncExecutionRepository),
      syncMbValeursUseCase: asModuleClass(SyncMbValeursUseCase),
    } satisfies VerifyCradle<MbSyncCradle>);
  },
});

type Scope = ExtractScope<typeof mbSyncModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

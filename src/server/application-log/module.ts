import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { ApplicationLogRepository } from "@/server/application-log/domain/ApplicationLogRepository.interface";
import { ApplicationLogSQLRepository } from "@/server/infrastructure/accès_données/application-log/ApplicationLogSQLRepository";
import { ListerLogsUseCase } from "@/server/application-log/usecases/ListerLogsUseCase";
import { ObtenirStatistiquesLogsUseCase } from "@/server/application-log/usecases/ObtenirStatistiquesLogsUseCase";
import { PurgerLogsUseCase } from "@/server/application-log/usecases/PurgerLogsUseCase";

type ApplicationLogCradle = {
  applicationLogRepository: ApplicationLogRepository;
  listerLogsUseCase: ListerLogsUseCase;
  obtenirStatistiquesLogsUseCase: ObtenirStatistiquesLogsUseCase;
  purgerLogsUseCase: PurgerLogsUseCase;
};

export const applicationLogModule = defineModule<
  NoExports,
  ApplicationLogCradle
>()({
  name: "applicationLog",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      applicationLogRepository: asModuleClass(ApplicationLogSQLRepository),
      listerLogsUseCase: asModuleClass(ListerLogsUseCase),
      obtenirStatistiquesLogsUseCase: asModuleClass(
        ObtenirStatistiquesLogsUseCase,
      ),
      purgerLogsUseCase: asModuleClass(PurgerLogsUseCase),
    } satisfies VerifyCradle<ApplicationLogCradle>);
  },
});

type Scope = ExtractScope<typeof applicationLogModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

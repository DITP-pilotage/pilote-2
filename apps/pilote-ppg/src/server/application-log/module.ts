import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { ApplicationLogRepository } from "@/server/application-log/domain/ApplicationLogRepository";
import { ApplicationLogSQLRepository } from "@/server/infrastructure/accès_données/application-log/ApplicationLogSQLRepository";
import { ListerLogsQuery } from "@/server/application-log/queries/ListerLogsQuery";
import { ObtenirStatistiquesLogsQuery } from "@/server/application-log/queries/ObtenirStatistiquesLogsQuery";
import { PurgerLogsUseCase } from "@/server/application-log/usecases/PurgerLogsUseCase";

type ApplicationLogCradle = {
  applicationLogRepository: ApplicationLogRepository;
  listerLogsQuery: ListerLogsQuery;
  obtenirStatistiquesLogsQuery: ObtenirStatistiquesLogsQuery;
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
      listerLogsQuery: asModuleClass(ListerLogsQuery),
      obtenirStatistiquesLogsQuery: asModuleClass(ObtenirStatistiquesLogsQuery),
      purgerLogsUseCase: asModuleClass(PurgerLogsUseCase),
    } satisfies VerifyCradle<ApplicationLogCradle>);
  },
});

type Scope = ExtractScope<typeof applicationLogModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

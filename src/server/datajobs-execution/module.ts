import { defineModule, type ExtractScope } from "@/server/module-system";
import { DatajobsExecutionQueries } from "./DatajobsExecution";

export type DatajobsExecutionExports = {
  datajobsExecutionQueries: DatajobsExecutionQueries;
};

type DatajobsExecutionCradle = DatajobsExecutionExports;

export const datajobsExecutionModule = defineModule<
  DatajobsExecutionExports,
  DatajobsExecutionCradle
>()({
  name: "datajobsExecution",
  imports: ["shared"],
  exports: ["datajobsExecutionQueries"],
  register: (container, { asModuleClass }) => {
    container.register({
      datajobsExecutionQueries: asModuleClass(DatajobsExecutionQueries),
    } satisfies Record<keyof DatajobsExecutionCradle, unknown>);
  },
});

type Scope = ExtractScope<typeof datajobsExecutionModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

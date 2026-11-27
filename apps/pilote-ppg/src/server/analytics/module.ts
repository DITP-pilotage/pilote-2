import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { FrameworkDependencies } from "@/server/framework/module";
import { GetDimensionSlotsQuery } from "./queries/GetDimensionSlotsQuery";
import { SetDimensionSlotHandler } from "./handlers/SetDimensionSlotHandler";

type AnalyticsOwnCradle = {
  getDimensionSlotsQuery: GetDimensionSlotsQuery;
  setDimensionSlotHandler: SetDimensionSlotHandler;
};

type AnalyticsCradle = AnalyticsOwnCradle & FrameworkDependencies;

export const analyticsModule = defineModule<NoExports, AnalyticsCradle>()({
  name: "analytics",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      getDimensionSlotsQuery: asModuleClass(GetDimensionSlotsQuery),
      setDimensionSlotHandler: asModuleClass(SetDimensionSlotHandler),
    } satisfies VerifyCradle<AnalyticsOwnCradle>);
  },
});

type Scope = ExtractScope<typeof analyticsModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

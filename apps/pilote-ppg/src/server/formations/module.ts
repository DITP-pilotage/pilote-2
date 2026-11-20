import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { FrameworkDependencies } from "@/server/framework/module";
import { ListSeancesAVenirQuery } from "./queries/ListSeancesAVenirQuery";

type FormationsOwnCradle = {
  listSeancesAVenirQuery: ListSeancesAVenirQuery;
};

type FormationsCradle = FormationsOwnCradle & FrameworkDependencies;

export const formationsModule = defineModule<NoExports, FormationsCradle>()({
  name: "formations",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listSeancesAVenirQuery: asModuleClass(ListSeancesAVenirQuery),
    } satisfies VerifyCradle<FormationsOwnCradle>);
  },
});

type Scope = ExtractScope<typeof formationsModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

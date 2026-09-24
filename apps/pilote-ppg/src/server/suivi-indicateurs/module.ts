import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerIndicateursNonAJourQuery } from "./queries/ListerIndicateursNonAJourQuery";
import { ListerTerritoiresNonAJourQuery } from "./queries/ListerTerritoiresNonAJourQuery";

type SuiviIndicateursCradle = {
  listerIndicateursNonAJourQuery: ListerIndicateursNonAJourQuery;
  listerTerritoiresNonAJourQuery: ListerTerritoiresNonAJourQuery;
};

export const suiviIndicateursModule = defineModule<
  NoExports,
  SuiviIndicateursCradle
>()({
  name: "suiviIndicateurs",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerIndicateursNonAJourQuery: asModuleClass(
        ListerIndicateursNonAJourQuery,
      ),
      listerTerritoiresNonAJourQuery: asModuleClass(
        ListerTerritoiresNonAJourQuery,
      ),
    } satisfies VerifyCradle<SuiviIndicateursCradle>);
  },
});

type Scope = ExtractScope<typeof suiviIndicateursModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

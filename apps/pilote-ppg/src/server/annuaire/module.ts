import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerCoordinateursAnnuaireQuery } from "./queries/ListerCoordinateursAnnuaireQuery";
import { ListerResponsablesAnnuaireQuery } from "./queries/ListerResponsablesAnnuaireQuery";

type AnnuaireCradle = {
  listerCoordinateursAnnuaireQuery: ListerCoordinateursAnnuaireQuery;
  listerResponsablesAnnuaireQuery: ListerResponsablesAnnuaireQuery;
};

export const annuaireModule = defineModule<NoExports, AnnuaireCradle>()({
  name: "annuaire",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerCoordinateursAnnuaireQuery: asModuleClass(
        ListerCoordinateursAnnuaireQuery,
      ),
      listerResponsablesAnnuaireQuery: asModuleClass(
        ListerResponsablesAnnuaireQuery,
      ),
    } satisfies VerifyCradle<AnnuaireCradle>);
  },
});

type Scope = ExtractScope<typeof annuaireModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

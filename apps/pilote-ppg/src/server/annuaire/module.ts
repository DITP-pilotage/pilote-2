import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerCoordinateursAnnuaireQuery } from "./queries/ListerCoordinateursAnnuaireQuery";

type AnnuaireCradle = {
  listerCoordinateursAnnuaireQuery: ListerCoordinateursAnnuaireQuery;
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
    } satisfies VerifyCradle<AnnuaireCradle>);
  },
});

type Scope = ExtractScope<typeof annuaireModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

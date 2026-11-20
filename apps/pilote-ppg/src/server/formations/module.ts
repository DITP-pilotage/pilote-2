import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { FrameworkDependencies } from "@/server/framework/module";
import { ListSeancesAVenirQuery } from "./queries/ListSeancesAVenirQuery";
import { GetMatriceProfilsQuery } from "./queries/GetMatriceProfilsQuery";
import { SetMotifProfilHandler } from "./handlers/SetMotifProfilHandler";
import { ListPeriodesInformationQuery } from "./queries/ListPeriodesInformationQuery";
import { SavePeriodeInformationHandler } from "./handlers/SavePeriodeInformationHandler";
import { DeletePeriodeInformationHandler } from "./handlers/DeletePeriodeInformationHandler";
import { SyncFormationsHandler } from "./handlers/SyncFormationsHandler";

type FormationsOwnCradle = {
  listSeancesAVenirQuery: ListSeancesAVenirQuery;
  getMatriceProfilsQuery: GetMatriceProfilsQuery;
  setMotifProfilHandler: SetMotifProfilHandler;
  listPeriodesInformationQuery: ListPeriodesInformationQuery;
  savePeriodeInformationHandler: SavePeriodeInformationHandler;
  deletePeriodeInformationHandler: DeletePeriodeInformationHandler;
  syncFormationsHandler: SyncFormationsHandler;
};

type FormationsCradle = FormationsOwnCradle & FrameworkDependencies;

export const formationsModule = defineModule<NoExports, FormationsCradle>()({
  name: "formations",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listSeancesAVenirQuery: asModuleClass(ListSeancesAVenirQuery),
      getMatriceProfilsQuery: asModuleClass(GetMatriceProfilsQuery),
      setMotifProfilHandler: asModuleClass(SetMotifProfilHandler),
      listPeriodesInformationQuery: asModuleClass(ListPeriodesInformationQuery),
      savePeriodeInformationHandler: asModuleClass(
        SavePeriodeInformationHandler,
      ),
      deletePeriodeInformationHandler: asModuleClass(
        DeletePeriodeInformationHandler,
      ),
      syncFormationsHandler: asModuleClass(SyncFormationsHandler),
    } satisfies VerifyCradle<FormationsOwnCradle>);
  },
});

type Scope = ExtractScope<typeof formationsModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

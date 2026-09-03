import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerAxesAdminQuery } from "./queries/ListerAxesAdminQuery";
import { RecupererAxeQuery } from "./queries/RecupererAxeQuery";
import { VerifierUtilisationAxeQuery } from "./queries/VerifierUtilisationAxeQuery";
import { EnregistrerAxeHandler } from "./handlers/EnregistrerAxeHandler";
import { ArchiverAxeHandler } from "./handlers/ArchiverAxeHandler";
import { RestorerAxeHandler } from "./handlers/RestorerAxeHandler";

type MetadataAxeCradle = {
  listerAxesAdminQuery: ListerAxesAdminQuery;
  recupererAxeQuery: RecupererAxeQuery;
  verifierUtilisationAxeQuery: VerifierUtilisationAxeQuery;
  enregistrerAxeHandler: EnregistrerAxeHandler;
  archiverAxeHandler: ArchiverAxeHandler;
  restorerAxeHandler: RestorerAxeHandler;
};

export const metadataAxeModule = defineModule<NoExports, MetadataAxeCradle>()({
  name: "metadataAxe",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerAxesAdminQuery: asModuleClass(ListerAxesAdminQuery),
      recupererAxeQuery: asModuleClass(RecupererAxeQuery),
      verifierUtilisationAxeQuery: asModuleClass(VerifierUtilisationAxeQuery),
      enregistrerAxeHandler: asModuleClass(EnregistrerAxeHandler),
      archiverAxeHandler: asModuleClass(ArchiverAxeHandler),
      restorerAxeHandler: asModuleClass(RestorerAxeHandler),
    } satisfies VerifyCradle<MetadataAxeCradle>);
  },
});

type Scope = ExtractScope<typeof metadataAxeModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

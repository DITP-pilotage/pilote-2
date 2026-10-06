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
import { RestaurerAxeHandler } from "./handlers/RestaurerAxeHandler";

type MetadataAxeCradle = {
  listerAxesAdminQuery: ListerAxesAdminQuery;
  recupererAxeQuery: RecupererAxeQuery;
  verifierUtilisationAxeQuery: VerifierUtilisationAxeQuery;
  enregistrerAxeHandler: EnregistrerAxeHandler;
  archiverAxeHandler: ArchiverAxeHandler;
  restaurerAxeHandler: RestaurerAxeHandler;
};

export const metadataAxeModule = defineModule<NoExports, MetadataAxeCradle>()({
  name: "metadataAxe",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerAxesAdminQuery: asModuleClass(ListerAxesAdminQuery),
      recupererAxeQuery: asModuleClass(RecupererAxeQuery),
      verifierUtilisationAxeQuery: asModuleClass(VerifierUtilisationAxeQuery),
      enregistrerAxeHandler: asModuleClass(EnregistrerAxeHandler),
      archiverAxeHandler: asModuleClass(ArchiverAxeHandler),
      restaurerAxeHandler: asModuleClass(RestaurerAxeHandler),
    } satisfies VerifyCradle<MetadataAxeCradle>);
  },
});

type Scope = ExtractScope<typeof metadataAxeModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerPpgsAdminQuery } from "./queries/ListerPpgsAdminQuery";
import { RecupererPpgQuery } from "./queries/RecupererPpgQuery";
import { VerifierUtilisationPpgQuery } from "./queries/VerifierUtilisationPpgQuery";
import { EnregistrerPpgHandler } from "./handlers/EnregistrerPpgHandler";
import { ArchiverPpgHandler } from "./handlers/ArchiverPpgHandler";
import { RestorerPpgHandler } from "./handlers/RestorerPpgHandler";

type MetadataPpgCradle = {
  listerPpgsAdminQuery: ListerPpgsAdminQuery;
  recupererPpgQuery: RecupererPpgQuery;
  verifierUtilisationPpgQuery: VerifierUtilisationPpgQuery;
  enregistrerPpgHandler: EnregistrerPpgHandler;
  archiverPpgHandler: ArchiverPpgHandler;
  restorerPpgHandler: RestorerPpgHandler;
};

export const metadataPpgModule = defineModule<NoExports, MetadataPpgCradle>()({
  name: "metadataPpg",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerPpgsAdminQuery: asModuleClass(ListerPpgsAdminQuery),
      recupererPpgQuery: asModuleClass(RecupererPpgQuery),
      verifierUtilisationPpgQuery: asModuleClass(VerifierUtilisationPpgQuery),
      enregistrerPpgHandler: asModuleClass(EnregistrerPpgHandler),
      archiverPpgHandler: asModuleClass(ArchiverPpgHandler),
      restorerPpgHandler: asModuleClass(RestorerPpgHandler),
    } satisfies VerifyCradle<MetadataPpgCradle>);
  },
});

type Scope = ExtractScope<typeof metadataPpgModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

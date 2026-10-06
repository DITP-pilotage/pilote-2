import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerPerimetresAdminQuery } from "./queries/ListerPerimetresAdminQuery";
import { RecupererPerimetreQuery } from "./queries/RecupererPerimetreQuery";
import { RecupererIdSuivantPerimetreQuery } from "./queries/RecupererIdSuivantPerimetreQuery";
import { VerifierUtilisationPerimetreQuery } from "./queries/VerifierUtilisationPerimetreQuery";
import { EnregistrerPerimetreHandler } from "./handlers/EnregistrerPerimetreHandler";
import { ArchiverPerimetreHandler } from "./handlers/ArchiverPerimetreHandler";
import { RestaurerPerimetreHandler } from "./handlers/RestaurerPerimetreHandler";

type MetadataPerimetreCradle = {
  listerPerimetresAdminQuery: ListerPerimetresAdminQuery;
  recupererPerimetreQuery: RecupererPerimetreQuery;
  recupererIdSuivantPerimetreQuery: RecupererIdSuivantPerimetreQuery;
  verifierUtilisationPerimetreQuery: VerifierUtilisationPerimetreQuery;
  enregistrerPerimetreHandler: EnregistrerPerimetreHandler;
  archiverPerimetreHandler: ArchiverPerimetreHandler;
  restaurerPerimetreHandler: RestaurerPerimetreHandler;
};

export const metadataPerimetreModule = defineModule<
  NoExports,
  MetadataPerimetreCradle
>()({
  name: "metadataPerimetre",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerPerimetresAdminQuery: asModuleClass(ListerPerimetresAdminQuery),
      recupererPerimetreQuery: asModuleClass(RecupererPerimetreQuery),
      recupererIdSuivantPerimetreQuery: asModuleClass(
        RecupererIdSuivantPerimetreQuery,
      ),
      verifierUtilisationPerimetreQuery: asModuleClass(
        VerifierUtilisationPerimetreQuery,
      ),
      enregistrerPerimetreHandler: asModuleClass(EnregistrerPerimetreHandler),
      archiverPerimetreHandler: asModuleClass(ArchiverPerimetreHandler),
      restaurerPerimetreHandler: asModuleClass(RestaurerPerimetreHandler),
    } satisfies VerifyCradle<MetadataPerimetreCradle>);
  },
});

type Scope = ExtractScope<typeof metadataPerimetreModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

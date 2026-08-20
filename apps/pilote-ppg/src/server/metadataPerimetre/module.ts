import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerPerimetresAdminQuery } from "./queries/ListerPerimetresAdminQuery";
import { RecupererPerimetreQuery } from "./queries/RecupererPerimetreQuery";
import { RecupererIdSuivantPerimetreQuery } from "./queries/RecupererIdSuivantPerimetreQuery";
import { EnregistrerPerimetreHandler } from "./handlers/EnregistrerPerimetreHandler";
import { ArchiverOuRestorerPerimetreHandler } from "./handlers/ArchiverOuRestorerPerimetreHandler";

type MetadataPerimetreCradle = {
  listerPerimetresAdminQuery: ListerPerimetresAdminQuery;
  recupererPerimetreQuery: RecupererPerimetreQuery;
  recupererIdSuivantPerimetreQuery: RecupererIdSuivantPerimetreQuery;
  enregistrerPerimetreHandler: EnregistrerPerimetreHandler;
  archiverOuRestorerPerimetreHandler: ArchiverOuRestorerPerimetreHandler;
};

export const metadataPerimetreModule = defineModule<
  NoExports,
  MetadataPerimetreCradle
>()({
  name: "metadataPerimetre",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerPerimetresAdminQuery: asModuleClass(ListerPerimetresAdminQuery),
      recupererPerimetreQuery: asModuleClass(RecupererPerimetreQuery),
      recupererIdSuivantPerimetreQuery: asModuleClass(
        RecupererIdSuivantPerimetreQuery,
      ),
      enregistrerPerimetreHandler: asModuleClass(EnregistrerPerimetreHandler),
      archiverOuRestorerPerimetreHandler: asModuleClass(
        ArchiverOuRestorerPerimetreHandler,
      ),
    } satisfies VerifyCradle<MetadataPerimetreCradle>);
  },
});

type Scope = ExtractScope<typeof metadataPerimetreModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

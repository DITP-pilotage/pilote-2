import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerPorteursAdminQuery } from "./queries/ListerPorteursAdminQuery";
import { RecupererPorteurQuery } from "./queries/RecupererPorteurQuery";
import { RecupererIdSuivantPorteurQuery } from "./queries/RecupererIdSuivantPorteurQuery";
import { EnregistrerPorteurHandler } from "./handlers/EnregistrerPorteurHandler";
import { ArchiverOuRestorerPorteurHandler } from "./handlers/ArchiverOuRestorerPorteurHandler";

type MetadataPorteurCradle = {
  listerPorteursAdminQuery: ListerPorteursAdminQuery;
  recupererPorteurQuery: RecupererPorteurQuery;
  recupererIdSuivantPorteurQuery: RecupererIdSuivantPorteurQuery;
  enregistrerPorteurHandler: EnregistrerPorteurHandler;
  archiverOuRestorerPorteurHandler: ArchiverOuRestorerPorteurHandler;
};

export const metadataPorteurModule = defineModule<
  NoExports,
  MetadataPorteurCradle
>()({
  name: "metadataPorteur",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerPorteursAdminQuery: asModuleClass(ListerPorteursAdminQuery),
      recupererPorteurQuery: asModuleClass(RecupererPorteurQuery),
      recupererIdSuivantPorteurQuery: asModuleClass(
        RecupererIdSuivantPorteurQuery,
      ),
      enregistrerPorteurHandler: asModuleClass(EnregistrerPorteurHandler),
      archiverOuRestorerPorteurHandler: asModuleClass(
        ArchiverOuRestorerPorteurHandler,
      ),
    } satisfies VerifyCradle<MetadataPorteurCradle>);
  },
});

type Scope = ExtractScope<typeof metadataPorteurModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerZonegroupsAdminQuery } from "./queries/ListerZonegroupsAdminQuery";
import { RecupererZonegroupQuery } from "./queries/RecupererZonegroupQuery";
import { RecupererIdSuivantZonegroupQuery } from "./queries/RecupererIdSuivantZonegroupQuery";
import { ListerZonesDisponiblesQuery } from "./queries/ListerZonesDisponiblesQuery";
import { EnregistrerZonegroupHandler } from "./handlers/EnregistrerZonegroupHandler";
import { ArchiverZonegroupHandler } from "./handlers/ArchiverZonegroupHandler";
import { RestorerZonegroupHandler } from "./handlers/RestorerZonegroupHandler";

type MetadataZonegroupCradle = {
  listerZonegroupsAdminQuery: ListerZonegroupsAdminQuery;
  recupererZonegroupQuery: RecupererZonegroupQuery;
  recupererIdSuivantZonegroupQuery: RecupererIdSuivantZonegroupQuery;
  listerZonesDisponiblesQuery: ListerZonesDisponiblesQuery;
  enregistrerZonegroupHandler: EnregistrerZonegroupHandler;
  archiverZonegroupHandler: ArchiverZonegroupHandler;
  restorerZonegroupHandler: RestorerZonegroupHandler;
};

export const metadataZonegroupModule = defineModule<
  NoExports,
  MetadataZonegroupCradle
>()({
  name: "metadataZonegroup",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerZonegroupsAdminQuery: asModuleClass(ListerZonegroupsAdminQuery),
      recupererZonegroupQuery: asModuleClass(RecupererZonegroupQuery),
      recupererIdSuivantZonegroupQuery: asModuleClass(
        RecupererIdSuivantZonegroupQuery,
      ),
      listerZonesDisponiblesQuery: asModuleClass(ListerZonesDisponiblesQuery),
      enregistrerZonegroupHandler: asModuleClass(EnregistrerZonegroupHandler),
      archiverZonegroupHandler: asModuleClass(ArchiverZonegroupHandler),
      restorerZonegroupHandler: asModuleClass(RestorerZonegroupHandler),
    } satisfies VerifyCradle<MetadataZonegroupCradle>);
  },
});

type Scope = ExtractScope<typeof metadataZonegroupModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

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
import { VerifierUtilisationZonegroupQuery } from "./queries/VerifierUtilisationZonegroupQuery";
import { EnregistrerZonegroupHandler } from "./handlers/EnregistrerZonegroupHandler";
import { ArchiverZonegroupHandler } from "./handlers/ArchiverZonegroupHandler";
import { RestaurerZonegroupHandler } from "./handlers/RestaurerZonegroupHandler";

type MetadataZonegroupCradle = {
  listerZonegroupsAdminQuery: ListerZonegroupsAdminQuery;
  recupererZonegroupQuery: RecupererZonegroupQuery;
  recupererIdSuivantZonegroupQuery: RecupererIdSuivantZonegroupQuery;
  listerZonesDisponiblesQuery: ListerZonesDisponiblesQuery;
  verifierUtilisationZonegroupQuery: VerifierUtilisationZonegroupQuery;
  enregistrerZonegroupHandler: EnregistrerZonegroupHandler;
  archiverZonegroupHandler: ArchiverZonegroupHandler;
  restaurerZonegroupHandler: RestaurerZonegroupHandler;
};

export const metadataZonegroupModule = defineModule<
  NoExports,
  MetadataZonegroupCradle
>()({
  name: "metadataZonegroup",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerZonegroupsAdminQuery: asModuleClass(ListerZonegroupsAdminQuery),
      recupererZonegroupQuery: asModuleClass(RecupererZonegroupQuery),
      recupererIdSuivantZonegroupQuery: asModuleClass(
        RecupererIdSuivantZonegroupQuery,
      ),
      listerZonesDisponiblesQuery: asModuleClass(ListerZonesDisponiblesQuery),
      verifierUtilisationZonegroupQuery: asModuleClass(
        VerifierUtilisationZonegroupQuery,
      ),
      enregistrerZonegroupHandler: asModuleClass(EnregistrerZonegroupHandler),
      archiverZonegroupHandler: asModuleClass(ArchiverZonegroupHandler),
      restaurerZonegroupHandler: asModuleClass(RestaurerZonegroupHandler),
    } satisfies VerifyCradle<MetadataZonegroupCradle>);
  },
});

type Scope = ExtractScope<typeof metadataZonegroupModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

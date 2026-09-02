import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerEngagementsAdminQuery } from "./queries/ListerEngagementsAdminQuery";
import { RecupererEngagementQuery } from "./queries/RecupererEngagementQuery";
import { RecupererIdSuivantEngagementQuery } from "./queries/RecupererIdSuivantEngagementQuery";
import { VerifierUtilisationEngagementQuery } from "./queries/VerifierUtilisationEngagementQuery";
import { EnregistrerEngagementHandler } from "./handlers/EnregistrerEngagementHandler";
import { ArchiverEngagementHandler } from "./handlers/ArchiverEngagementHandler";
import { RestorerEngagementHandler } from "./handlers/RestorerEngagementHandler";

type MetadataEngagementCradle = {
  listerEngagementsAdminQuery: ListerEngagementsAdminQuery;
  recupererEngagementQuery: RecupererEngagementQuery;
  recupererIdSuivantEngagementQuery: RecupererIdSuivantEngagementQuery;
  verifierUtilisationEngagementQuery: VerifierUtilisationEngagementQuery;
  enregistrerEngagementHandler: EnregistrerEngagementHandler;
  archiverEngagementHandler: ArchiverEngagementHandler;
  restorerEngagementHandler: RestorerEngagementHandler;
};

export const metadataEngagementModule = defineModule<
  NoExports,
  MetadataEngagementCradle
>()({
  name: "metadataEngagement",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerEngagementsAdminQuery: asModuleClass(ListerEngagementsAdminQuery),
      recupererEngagementQuery: asModuleClass(RecupererEngagementQuery),
      recupererIdSuivantEngagementQuery: asModuleClass(
        RecupererIdSuivantEngagementQuery,
      ),
      verifierUtilisationEngagementQuery: asModuleClass(
        VerifierUtilisationEngagementQuery,
      ),
      enregistrerEngagementHandler: asModuleClass(EnregistrerEngagementHandler),
      archiverEngagementHandler: asModuleClass(ArchiverEngagementHandler),
      restorerEngagementHandler: asModuleClass(RestorerEngagementHandler),
    } satisfies VerifyCradle<MetadataEngagementCradle>);
  },
});

type Scope = ExtractScope<typeof metadataEngagementModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

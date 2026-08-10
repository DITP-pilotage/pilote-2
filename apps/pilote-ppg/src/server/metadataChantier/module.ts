import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerChantiersQuery } from "./queries/ListerChantiersQuery";
import { RecupererChantierQuery } from "./queries/RecupererChantierQuery";
import { RecupererIdSuivantQuery } from "./queries/RecupererIdSuivantQuery";
import { ListerPpgsQuery } from "./queries/ListerPpgsQuery";
import { ListerPorteursQuery } from "./queries/ListerPorteursQuery";
import { ListerPerimetresQuery } from "./queries/ListerPerimetresQuery";
import { ListerZonegroupsQuery } from "./queries/ListerZonegroupsQuery";
import { EnregistrerChantierHandler } from "./handlers/EnregistrerChantierHandler";

type MetadataChantierCradle = {
  listerChantiersQuery: ListerChantiersQuery;
  recupererChantierQuery: RecupererChantierQuery;
  recupererIdSuivantQuery: RecupererIdSuivantQuery;
  listerPpgsQuery: ListerPpgsQuery;
  listerPorteursQuery: ListerPorteursQuery;
  listerPerimetresQuery: ListerPerimetresQuery;
  listerZonegroupsQuery: ListerZonegroupsQuery;
  enregistrerChantierHandler: EnregistrerChantierHandler;
};

export const metadataChantierModule = defineModule<
  NoExports,
  MetadataChantierCradle
>()({
  name: "metadataChantier",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listerChantiersQuery: asModuleClass(ListerChantiersQuery),
      recupererChantierQuery: asModuleClass(RecupererChantierQuery),
      recupererIdSuivantQuery: asModuleClass(RecupererIdSuivantQuery),
      listerPpgsQuery: asModuleClass(ListerPpgsQuery),
      listerPorteursQuery: asModuleClass(ListerPorteursQuery),
      listerPerimetresQuery: asModuleClass(ListerPerimetresQuery),
      listerZonegroupsQuery: asModuleClass(ListerZonegroupsQuery),
      enregistrerChantierHandler: asModuleClass(EnregistrerChantierHandler),
    } satisfies VerifyCradle<MetadataChantierCradle>);
  },
});

type Scope = ExtractScope<typeof metadataChantierModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

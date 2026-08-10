import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerChantiersQuery } from "./queries/ListerChantiersQuery";
import { RecupererChantierQuery } from "./queries/RecupererChantierQuery";
import { RecupererOptionsChantierQuery } from "./queries/RecupererOptionsChantierQuery";
import { RecupererIdSuivantQuery } from "./queries/RecupererIdSuivantQuery";
import { ModifierChantierHandler } from "./handlers/ModifierChantierHandler";
import { CreerChantierHandler } from "./handlers/CreerChantierHandler";

type MetadataChantierCradle = {
  listerChantiersQuery: ListerChantiersQuery;
  recupererChantierQuery: RecupererChantierQuery;
  recupererOptionsChantierQuery: RecupererOptionsChantierQuery;
  recupererIdSuivantQuery: RecupererIdSuivantQuery;
  modifierChantierHandler: ModifierChantierHandler;
  creerChantierHandler: CreerChantierHandler;
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
      recupererOptionsChantierQuery: asModuleClass(
        RecupererOptionsChantierQuery,
      ),
      recupererIdSuivantQuery: asModuleClass(RecupererIdSuivantQuery),
      modifierChantierHandler: asModuleClass(ModifierChantierHandler),
      creerChantierHandler: asModuleClass(CreerChantierHandler),
    } satisfies VerifyCradle<MetadataChantierCradle>);
  },
});

type Scope = ExtractScope<typeof metadataChantierModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

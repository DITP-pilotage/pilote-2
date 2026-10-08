import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { ParametrageIndicateurExports } from "@/server/parametrage-indicateur/module";
import { ListChantiersQuery } from "./queries/ListChantiersQuery";
import { GetChantierQuery } from "./queries/GetChantierQuery";
import { GetNextIdQuery } from "./queries/GetNextIdQuery";
import { ListPpgsQuery } from "./queries/ListPpgsQuery";
import { ListPorteursQuery } from "./queries/ListPorteursQuery";
import { ListPerimetresQuery } from "./queries/ListPerimetresQuery";
import { ListZonegroupsQuery } from "./queries/ListZonegroupsQuery";
import { SaveChantierHandler } from "./handlers/SaveChantierHandler";
import { GetIndicateursPonderationsChantierQuery } from "./queries/GetIndicateursPonderationsChantierQuery";
import { SavePonderationsIndicateursHandler } from "./handlers/SavePonderationsIndicateursHandler";

type MetadataChantierOwnCradle = {
  listChantiersQuery: ListChantiersQuery;
  getChantierQuery: GetChantierQuery;
  getNextIdQuery: GetNextIdQuery;
  listPpgsQuery: ListPpgsQuery;
  listPorteursQuery: ListPorteursQuery;
  listPerimetresQuery: ListPerimetresQuery;
  listZonegroupsQuery: ListZonegroupsQuery;
  saveChantierHandler: SaveChantierHandler;
  getIndicateursPonderationsChantierQuery: GetIndicateursPonderationsChantierQuery;
  savePonderationsIndicateursHandler: SavePonderationsIndicateursHandler;
};

type MetadataChantierCradle = MetadataChantierOwnCradle &
  ParametrageIndicateurExports;

export const parametrageChantierModule = defineModule<
  NoExports,
  MetadataChantierCradle
>()({
  name: "parametrageChantier",
  imports: ["framework", "parametrageIndicateur"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      listChantiersQuery: asModuleClass(ListChantiersQuery),
      getChantierQuery: asModuleClass(GetChantierQuery),
      getNextIdQuery: asModuleClass(GetNextIdQuery),
      listPpgsQuery: asModuleClass(ListPpgsQuery),
      listPorteursQuery: asModuleClass(ListPorteursQuery),
      listPerimetresQuery: asModuleClass(ListPerimetresQuery),
      listZonegroupsQuery: asModuleClass(ListZonegroupsQuery),
      saveChantierHandler: asModuleClass(SaveChantierHandler),
      getIndicateursPonderationsChantierQuery: asModuleClass(
        GetIndicateursPonderationsChantierQuery,
      ),
      savePonderationsIndicateursHandler: asModuleClass(
        SavePonderationsIndicateursHandler,
      ),
    } satisfies VerifyCradle<MetadataChantierOwnCradle>);
  },
});

type Scope = ExtractScope<typeof parametrageChantierModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

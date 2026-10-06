import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListAxesAdminQuery } from "./axe/queries/ListAxesAdminQuery";
import { GetAxeQuery } from "./axe/queries/GetAxeQuery";
import { CheckAxeUsageQuery } from "./axe/queries/CheckAxeUsageQuery";
import { SaveAxeHandler } from "./axe/handlers/SaveAxeHandler";
import { ArchiveAxeHandler } from "./axe/handlers/ArchiveAxeHandler";
import { RestoreAxeHandler } from "./axe/handlers/RestoreAxeHandler";
import { ListEngagementsAdminQuery } from "./engagement/queries/ListEngagementsAdminQuery";
import { GetEngagementQuery } from "./engagement/queries/GetEngagementQuery";
import { GetNextEngagementIdQuery } from "./engagement/queries/GetNextEngagementIdQuery";
import { CheckEngagementUsageQuery } from "./engagement/queries/CheckEngagementUsageQuery";
import { SaveEngagementHandler } from "./engagement/handlers/SaveEngagementHandler";
import { ArchiveEngagementHandler } from "./engagement/handlers/ArchiveEngagementHandler";
import { RestoreEngagementHandler } from "./engagement/handlers/RestoreEngagementHandler";
import { ListPerimetresAdminQuery } from "./perimetre/queries/ListPerimetresAdminQuery";
import { GetPerimetreQuery } from "./perimetre/queries/GetPerimetreQuery";
import { GetNextPerimetreIdQuery } from "./perimetre/queries/GetNextPerimetreIdQuery";
import { CheckPerimetreUsageQuery } from "./perimetre/queries/CheckPerimetreUsageQuery";
import { SavePerimetreHandler } from "./perimetre/handlers/SavePerimetreHandler";
import { ArchivePerimetreHandler } from "./perimetre/handlers/ArchivePerimetreHandler";
import { RestorePerimetreHandler } from "./perimetre/handlers/RestorePerimetreHandler";
import { ListPorteursAdminQuery } from "./porteur/queries/ListPorteursAdminQuery";
import { GetPorteurQuery } from "./porteur/queries/GetPorteurQuery";
import { GetNextPorteurIdQuery } from "./porteur/queries/GetNextPorteurIdQuery";
import { CheckPorteurUsageQuery } from "./porteur/queries/CheckPorteurUsageQuery";
import { SavePorteurHandler } from "./porteur/handlers/SavePorteurHandler";
import { ArchivePorteurHandler } from "./porteur/handlers/ArchivePorteurHandler";
import { RestorePorteurHandler } from "./porteur/handlers/RestorePorteurHandler";
import { ListPpgsAdminQuery } from "./ppg/queries/ListPpgsAdminQuery";
import { GetPpgQuery } from "./ppg/queries/GetPpgQuery";
import { CheckPpgUsageQuery } from "./ppg/queries/CheckPpgUsageQuery";
import { SavePpgHandler } from "./ppg/handlers/SavePpgHandler";
import { ArchivePpgHandler } from "./ppg/handlers/ArchivePpgHandler";
import { RestorePpgHandler } from "./ppg/handlers/RestorePpgHandler";
import { ListZonegroupsAdminQuery } from "./zonegroup/queries/ListZonegroupsAdminQuery";
import { GetZonegroupQuery } from "./zonegroup/queries/GetZonegroupQuery";
import { GetNextZonegroupIdQuery } from "./zonegroup/queries/GetNextZonegroupIdQuery";
import { ListZonesDisponiblesQuery } from "./zonegroup/queries/ListZonesDisponiblesQuery";
import { CheckZonegroupUsageQuery } from "./zonegroup/queries/CheckZonegroupUsageQuery";
import { SaveZonegroupHandler } from "./zonegroup/handlers/SaveZonegroupHandler";
import { ArchiveZonegroupHandler } from "./zonegroup/handlers/ArchiveZonegroupHandler";
import { RestoreZonegroupHandler } from "./zonegroup/handlers/RestoreZonegroupHandler";

type ReferentielsCradle = {
  listAxesAdminQuery: ListAxesAdminQuery;
  getAxeQuery: GetAxeQuery;
  checkAxeUsageQuery: CheckAxeUsageQuery;
  saveAxeHandler: SaveAxeHandler;
  archiveAxeHandler: ArchiveAxeHandler;
  restoreAxeHandler: RestoreAxeHandler;
  listEngagementsAdminQuery: ListEngagementsAdminQuery;
  getEngagementQuery: GetEngagementQuery;
  getNextEngagementIdQuery: GetNextEngagementIdQuery;
  checkEngagementUsageQuery: CheckEngagementUsageQuery;
  saveEngagementHandler: SaveEngagementHandler;
  archiveEngagementHandler: ArchiveEngagementHandler;
  restoreEngagementHandler: RestoreEngagementHandler;
  listPerimetresAdminQuery: ListPerimetresAdminQuery;
  getPerimetreQuery: GetPerimetreQuery;
  getNextPerimetreIdQuery: GetNextPerimetreIdQuery;
  checkPerimetreUsageQuery: CheckPerimetreUsageQuery;
  savePerimetreHandler: SavePerimetreHandler;
  archivePerimetreHandler: ArchivePerimetreHandler;
  restorePerimetreHandler: RestorePerimetreHandler;
  listPorteursAdminQuery: ListPorteursAdminQuery;
  getPorteurQuery: GetPorteurQuery;
  getNextPorteurIdQuery: GetNextPorteurIdQuery;
  checkPorteurUsageQuery: CheckPorteurUsageQuery;
  savePorteurHandler: SavePorteurHandler;
  archivePorteurHandler: ArchivePorteurHandler;
  restorePorteurHandler: RestorePorteurHandler;
  listPpgsAdminQuery: ListPpgsAdminQuery;
  getPpgQuery: GetPpgQuery;
  checkPpgUsageQuery: CheckPpgUsageQuery;
  savePpgHandler: SavePpgHandler;
  archivePpgHandler: ArchivePpgHandler;
  restorePpgHandler: RestorePpgHandler;
  listZonegroupsAdminQuery: ListZonegroupsAdminQuery;
  getZonegroupQuery: GetZonegroupQuery;
  getNextZonegroupIdQuery: GetNextZonegroupIdQuery;
  listZonesDisponiblesQuery: ListZonesDisponiblesQuery;
  checkZonegroupUsageQuery: CheckZonegroupUsageQuery;
  saveZonegroupHandler: SaveZonegroupHandler;
  archiveZonegroupHandler: ArchiveZonegroupHandler;
  restoreZonegroupHandler: RestoreZonegroupHandler;
};

export const referentielsModule = defineModule<NoExports, ReferentielsCradle>()(
  {
    name: "referentiels",
    imports: ["framework"],
    exports: [],
    register: (container, { asModuleClass }) => {
      container.register({
        listAxesAdminQuery: asModuleClass(ListAxesAdminQuery),
        getAxeQuery: asModuleClass(GetAxeQuery),
        checkAxeUsageQuery: asModuleClass(CheckAxeUsageQuery),
        saveAxeHandler: asModuleClass(SaveAxeHandler),
        archiveAxeHandler: asModuleClass(ArchiveAxeHandler),
        restoreAxeHandler: asModuleClass(RestoreAxeHandler),
        listEngagementsAdminQuery: asModuleClass(ListEngagementsAdminQuery),
        getEngagementQuery: asModuleClass(GetEngagementQuery),
        getNextEngagementIdQuery: asModuleClass(GetNextEngagementIdQuery),
        checkEngagementUsageQuery: asModuleClass(CheckEngagementUsageQuery),
        saveEngagementHandler: asModuleClass(SaveEngagementHandler),
        archiveEngagementHandler: asModuleClass(ArchiveEngagementHandler),
        restoreEngagementHandler: asModuleClass(RestoreEngagementHandler),
        listPerimetresAdminQuery: asModuleClass(ListPerimetresAdminQuery),
        getPerimetreQuery: asModuleClass(GetPerimetreQuery),
        getNextPerimetreIdQuery: asModuleClass(GetNextPerimetreIdQuery),
        checkPerimetreUsageQuery: asModuleClass(CheckPerimetreUsageQuery),
        savePerimetreHandler: asModuleClass(SavePerimetreHandler),
        archivePerimetreHandler: asModuleClass(ArchivePerimetreHandler),
        restorePerimetreHandler: asModuleClass(RestorePerimetreHandler),
        listPorteursAdminQuery: asModuleClass(ListPorteursAdminQuery),
        getPorteurQuery: asModuleClass(GetPorteurQuery),
        getNextPorteurIdQuery: asModuleClass(GetNextPorteurIdQuery),
        checkPorteurUsageQuery: asModuleClass(CheckPorteurUsageQuery),
        savePorteurHandler: asModuleClass(SavePorteurHandler),
        archivePorteurHandler: asModuleClass(ArchivePorteurHandler),
        restorePorteurHandler: asModuleClass(RestorePorteurHandler),
        listPpgsAdminQuery: asModuleClass(ListPpgsAdminQuery),
        getPpgQuery: asModuleClass(GetPpgQuery),
        checkPpgUsageQuery: asModuleClass(CheckPpgUsageQuery),
        savePpgHandler: asModuleClass(SavePpgHandler),
        archivePpgHandler: asModuleClass(ArchivePpgHandler),
        restorePpgHandler: asModuleClass(RestorePpgHandler),
        listZonegroupsAdminQuery: asModuleClass(ListZonegroupsAdminQuery),
        getZonegroupQuery: asModuleClass(GetZonegroupQuery),
        getNextZonegroupIdQuery: asModuleClass(GetNextZonegroupIdQuery),
        listZonesDisponiblesQuery: asModuleClass(ListZonesDisponiblesQuery),
        checkZonegroupUsageQuery: asModuleClass(CheckZonegroupUsageQuery),
        saveZonegroupHandler: asModuleClass(SaveZonegroupHandler),
        archiveZonegroupHandler: asModuleClass(ArchiveZonegroupHandler),
        restoreZonegroupHandler: asModuleClass(RestoreZonegroupHandler),
      } satisfies VerifyCradle<ReferentielsCradle>);
    },
  },
);

type Scope = ExtractScope<typeof referentielsModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

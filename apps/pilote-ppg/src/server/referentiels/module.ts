import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import { ListerAxesAdminQuery } from "./axe/queries/ListerAxesAdminQuery";
import { RecupererAxeQuery } from "./axe/queries/RecupererAxeQuery";
import { VerifierUtilisationAxeQuery } from "./axe/queries/VerifierUtilisationAxeQuery";
import { EnregistrerAxeHandler } from "./axe/handlers/EnregistrerAxeHandler";
import { ArchiverAxeHandler } from "./axe/handlers/ArchiverAxeHandler";
import { RestaurerAxeHandler } from "./axe/handlers/RestaurerAxeHandler";
import { ListerEngagementsAdminQuery } from "./engagement/queries/ListerEngagementsAdminQuery";
import { RecupererEngagementQuery } from "./engagement/queries/RecupererEngagementQuery";
import { RecupererIdSuivantEngagementQuery } from "./engagement/queries/RecupererIdSuivantEngagementQuery";
import { VerifierUtilisationEngagementQuery } from "./engagement/queries/VerifierUtilisationEngagementQuery";
import { EnregistrerEngagementHandler } from "./engagement/handlers/EnregistrerEngagementHandler";
import { ArchiverEngagementHandler } from "./engagement/handlers/ArchiverEngagementHandler";
import { RestaurerEngagementHandler } from "./engagement/handlers/RestaurerEngagementHandler";
import { ListerPerimetresAdminQuery } from "./perimetre/queries/ListerPerimetresAdminQuery";
import { RecupererPerimetreQuery } from "./perimetre/queries/RecupererPerimetreQuery";
import { RecupererIdSuivantPerimetreQuery } from "./perimetre/queries/RecupererIdSuivantPerimetreQuery";
import { VerifierUtilisationPerimetreQuery } from "./perimetre/queries/VerifierUtilisationPerimetreQuery";
import { EnregistrerPerimetreHandler } from "./perimetre/handlers/EnregistrerPerimetreHandler";
import { ArchiverPerimetreHandler } from "./perimetre/handlers/ArchiverPerimetreHandler";
import { RestaurerPerimetreHandler } from "./perimetre/handlers/RestaurerPerimetreHandler";
import { ListerPorteursAdminQuery } from "./porteur/queries/ListerPorteursAdminQuery";
import { RecupererPorteurQuery } from "./porteur/queries/RecupererPorteurQuery";
import { RecupererIdSuivantPorteurQuery } from "./porteur/queries/RecupererIdSuivantPorteurQuery";
import { VerifierUtilisationPorteurQuery } from "./porteur/queries/VerifierUtilisationPorteurQuery";
import { EnregistrerPorteurHandler } from "./porteur/handlers/EnregistrerPorteurHandler";
import { ArchiverPorteurHandler } from "./porteur/handlers/ArchiverPorteurHandler";
import { RestaurerPorteurHandler } from "./porteur/handlers/RestaurerPorteurHandler";
import { ListerPpgsAdminQuery } from "./ppg/queries/ListerPpgsAdminQuery";
import { RecupererPpgQuery } from "./ppg/queries/RecupererPpgQuery";
import { VerifierUtilisationPpgQuery } from "./ppg/queries/VerifierUtilisationPpgQuery";
import { EnregistrerPpgHandler } from "./ppg/handlers/EnregistrerPpgHandler";
import { ArchiverPpgHandler } from "./ppg/handlers/ArchiverPpgHandler";
import { RestaurerPpgHandler } from "./ppg/handlers/RestaurerPpgHandler";
import { ListerZonegroupsAdminQuery } from "./zonegroup/queries/ListerZonegroupsAdminQuery";
import { RecupererZonegroupQuery } from "./zonegroup/queries/RecupererZonegroupQuery";
import { RecupererIdSuivantZonegroupQuery } from "./zonegroup/queries/RecupererIdSuivantZonegroupQuery";
import { ListerZonesDisponiblesQuery } from "./zonegroup/queries/ListerZonesDisponiblesQuery";
import { VerifierUtilisationZonegroupQuery } from "./zonegroup/queries/VerifierUtilisationZonegroupQuery";
import { EnregistrerZonegroupHandler } from "./zonegroup/handlers/EnregistrerZonegroupHandler";
import { ArchiverZonegroupHandler } from "./zonegroup/handlers/ArchiverZonegroupHandler";
import { RestaurerZonegroupHandler } from "./zonegroup/handlers/RestaurerZonegroupHandler";

type ReferentielsCradle = {
  listerAxesAdminQuery: ListerAxesAdminQuery;
  recupererAxeQuery: RecupererAxeQuery;
  verifierUtilisationAxeQuery: VerifierUtilisationAxeQuery;
  enregistrerAxeHandler: EnregistrerAxeHandler;
  archiverAxeHandler: ArchiverAxeHandler;
  restaurerAxeHandler: RestaurerAxeHandler;
  listerEngagementsAdminQuery: ListerEngagementsAdminQuery;
  recupererEngagementQuery: RecupererEngagementQuery;
  recupererIdSuivantEngagementQuery: RecupererIdSuivantEngagementQuery;
  verifierUtilisationEngagementQuery: VerifierUtilisationEngagementQuery;
  enregistrerEngagementHandler: EnregistrerEngagementHandler;
  archiverEngagementHandler: ArchiverEngagementHandler;
  restaurerEngagementHandler: RestaurerEngagementHandler;
  listerPerimetresAdminQuery: ListerPerimetresAdminQuery;
  recupererPerimetreQuery: RecupererPerimetreQuery;
  recupererIdSuivantPerimetreQuery: RecupererIdSuivantPerimetreQuery;
  verifierUtilisationPerimetreQuery: VerifierUtilisationPerimetreQuery;
  enregistrerPerimetreHandler: EnregistrerPerimetreHandler;
  archiverPerimetreHandler: ArchiverPerimetreHandler;
  restaurerPerimetreHandler: RestaurerPerimetreHandler;
  listerPorteursAdminQuery: ListerPorteursAdminQuery;
  recupererPorteurQuery: RecupererPorteurQuery;
  recupererIdSuivantPorteurQuery: RecupererIdSuivantPorteurQuery;
  verifierUtilisationPorteurQuery: VerifierUtilisationPorteurQuery;
  enregistrerPorteurHandler: EnregistrerPorteurHandler;
  archiverPorteurHandler: ArchiverPorteurHandler;
  restaurerPorteurHandler: RestaurerPorteurHandler;
  listerPpgsAdminQuery: ListerPpgsAdminQuery;
  recupererPpgQuery: RecupererPpgQuery;
  verifierUtilisationPpgQuery: VerifierUtilisationPpgQuery;
  enregistrerPpgHandler: EnregistrerPpgHandler;
  archiverPpgHandler: ArchiverPpgHandler;
  restaurerPpgHandler: RestaurerPpgHandler;
  listerZonegroupsAdminQuery: ListerZonegroupsAdminQuery;
  recupererZonegroupQuery: RecupererZonegroupQuery;
  recupererIdSuivantZonegroupQuery: RecupererIdSuivantZonegroupQuery;
  listerZonesDisponiblesQuery: ListerZonesDisponiblesQuery;
  verifierUtilisationZonegroupQuery: VerifierUtilisationZonegroupQuery;
  enregistrerZonegroupHandler: EnregistrerZonegroupHandler;
  archiverZonegroupHandler: ArchiverZonegroupHandler;
  restaurerZonegroupHandler: RestaurerZonegroupHandler;
};

export const referentielsModule = defineModule<NoExports, ReferentielsCradle>()(
  {
    name: "referentiels",
    imports: ["framework"],
    exports: [],
    register: (container, { asModuleClass }) => {
      container.register({
        listerAxesAdminQuery: asModuleClass(ListerAxesAdminQuery),
        recupererAxeQuery: asModuleClass(RecupererAxeQuery),
        verifierUtilisationAxeQuery: asModuleClass(VerifierUtilisationAxeQuery),
        enregistrerAxeHandler: asModuleClass(EnregistrerAxeHandler),
        archiverAxeHandler: asModuleClass(ArchiverAxeHandler),
        restaurerAxeHandler: asModuleClass(RestaurerAxeHandler),
        listerEngagementsAdminQuery: asModuleClass(ListerEngagementsAdminQuery),
        recupererEngagementQuery: asModuleClass(RecupererEngagementQuery),
        recupererIdSuivantEngagementQuery: asModuleClass(
          RecupererIdSuivantEngagementQuery,
        ),
        verifierUtilisationEngagementQuery: asModuleClass(
          VerifierUtilisationEngagementQuery,
        ),
        enregistrerEngagementHandler: asModuleClass(
          EnregistrerEngagementHandler,
        ),
        archiverEngagementHandler: asModuleClass(ArchiverEngagementHandler),
        restaurerEngagementHandler: asModuleClass(RestaurerEngagementHandler),
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
        listerPorteursAdminQuery: asModuleClass(ListerPorteursAdminQuery),
        recupererPorteurQuery: asModuleClass(RecupererPorteurQuery),
        recupererIdSuivantPorteurQuery: asModuleClass(
          RecupererIdSuivantPorteurQuery,
        ),
        verifierUtilisationPorteurQuery: asModuleClass(
          VerifierUtilisationPorteurQuery,
        ),
        enregistrerPorteurHandler: asModuleClass(EnregistrerPorteurHandler),
        archiverPorteurHandler: asModuleClass(ArchiverPorteurHandler),
        restaurerPorteurHandler: asModuleClass(RestaurerPorteurHandler),
        listerPpgsAdminQuery: asModuleClass(ListerPpgsAdminQuery),
        recupererPpgQuery: asModuleClass(RecupererPpgQuery),
        verifierUtilisationPpgQuery: asModuleClass(VerifierUtilisationPpgQuery),
        enregistrerPpgHandler: asModuleClass(EnregistrerPpgHandler),
        archiverPpgHandler: asModuleClass(ArchiverPpgHandler),
        restaurerPpgHandler: asModuleClass(RestaurerPpgHandler),
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
      } satisfies VerifyCradle<ReferentielsCradle>);
    },
  },
);

type Scope = ExtractScope<typeof referentielsModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

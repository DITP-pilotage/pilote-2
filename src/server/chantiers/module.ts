import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { RecupererDonneesChantierQuery } from "@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery";
import { RecupererChantiersApplicablesParTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererChantiersApplicablesParTerritoiresQuery";
import { RecupererMesuresIndicateurParPeriodeQuery } from "@/server/chantiers/infrastructure/queries/RecupererMesuresIndicateurParPeriodeQuery";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import type { IndicateurTerritoireValeurEvenementExports } from "@/server/indicateur-territoire-valeur-evenement/module";
import type { DatajobsExecutionExports } from "@/server/datajobs-execution/module";
import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import type { LegacyExport } from "@/server/legacy/module";
import { TerritoireRepository } from "./domain/ports/TerritoireRepository";
import { PrismaTerritoireRepository } from "./infrastructure/adapters/PrismaTerritoireRepository";
import { UtilisateurRepository } from "./domain/ports/UtilisateurRepository";
import { PrismaUtilisateurRepository } from "./infrastructure/adapters/PrismaUtilisateurRepository";
import { EnvoieEmailService } from "./domain/ports/EnvoieEmailService";
import { BrevoEnvoieEmailService } from "./infrastructure/adapters/BrevoEnvoieEmailService";
import { RecupererDetailsIndicateursV2UseCase } from "./usecases/RecupererDetailsIndicateursV2UseCase";
import { RecupererChantiersAccessiblesEnLectureUseCaseV2 } from "./usecases/RecupererChantiersAccessiblesEnLectureUseCaseV2";
import RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2 from "./usecases/RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2";
import { ExportCsvDesChantiersUseCase } from "./usecases/ExportCsvDesChantiersUseCase";
import { RécupérerStatistiquesAvancementChantiersUseCase } from "./usecases/RécupérerStatistiquesAvancementChantiersUseCase";
import { ExportCsvDesIndicateursUseCase } from "./usecases/ExportCsvDesIndicateursUseCase";
import { ExportCsvDesHistoriquesIndicateursUseCase } from "./usecases/ExportCsvDesHistoriquesIndicateursUseCase";
import { MinistereRepository } from "./domain/ports/MinistereRepository";
import PrismaMinistereRepository from "./infrastructure/adapters/PrismaMinistereRepository";
import RecupererChantierUseCaseV2 from "./usecases/RecupererChantierUseCaseV2";
import { ListerDetailsIndicateurTerritoireUseCaseV2 } from "./usecases/ListerDetailsIndicateurTerritoireUseCaseV2";
import { RapportPropositionsAvancementRepository } from "./domain/ports/RapportPropositionsAvancementRepository";
import { PrismaRapportPropositionsAvancementRepository } from "./infrastructure/adapters/PrismaRapportPropositionsAvancementRepository";
import { CreerLesRapportsPropositionsUseCase } from "./usecases/CreerLesRapportsPropositionsUseCase";
import { EnvoyerLesRapportsPropositionsUseCase } from "./usecases/EnvoyerLesRapportsPropositionsUseCase";
import { GetChantierMeteosTerritoiresQuery } from "./infrastructure/queries/GetChantierMeteosTerritoiresQuery";
import { GetChantierPVACountTerritoiresQuery } from "./infrastructure/queries/GetChantierPVACountTerritoiresQuery";
import { GetIndicateurPVACountTerritoiresQuery } from "./infrastructure/queries/GetIndicateurPVACountTerritoiresQuery";
import { RecupererTauxAvancementsChantierTerritoiresQuery } from "./infrastructure/queries/RecupererTauxAvancementsChantierTerritoiresQuery";
import { RecupererValeursAvancementIndicateurTerritoiresQuery } from "./infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";
import { GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery } from "./infrastructure/queries/GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery";
import { RecupererTauxAvancementIndicateurTerritoiresQuery } from "./infrastructure/queries/RecupererTauxAvancementIndicateurTerritoiresQuery";
import { GetStatistiquesTauxAvancementIndicateurTerritoiresQuery } from "./infrastructure/queries/GetStatistiquesTauxAvancementIndicateurTerritoiresQuery";
import { GetRepartitionMeteoChantiersQuery } from "./infrastructure/queries/GetRepartitionMeteoChantiersQuery";
import { GetChantiersSignalesQuery } from "./infrastructure/queries/GetChantiersSignalesQuery";
import { GetStatistiquesAvancementChantiersQuery } from "./infrastructure/queries/GetStatistiquesAvancementChantiersQuery";
import { GetStatistiquesAvancementChantiersParChantierQuery } from "./infrastructure/queries/GetStatistiquesAvancementChantiersParChantierQuery";
import { RecupererEvolutionValeursAvancementTerritoiresQuery } from "./infrastructure/queries/RecupererEvolutionValeursAvancementTerritoiresQuery";
import { RecupererEvolutionTauxAvancementTerritoiresQuery } from "./infrastructure/queries/RecupererEvolutionTauxAvancementTerritoiresQuery";

type ChantierExports = {
  recupererChantiersQuery: RecupererChantiersApplicablesParTerritoiresQuery;
  mesuresIndicateurQuery: RecupererMesuresIndicateurParPeriodeQuery;
};

type ChantierImports = IndicateurTerritoireValeurEvenementExports &
  LegacyExport &
  DatajobsExecutionExports;

type ChantierOwnCradle = ChantierExports & {
  chantierRepository: ChantierRepository;
  indicateurRepository: IndicateurRepository;
  territoireRepository: TerritoireRepository;
  ministereRepository: MinistereRepository;
  utilisateurRepository: UtilisateurRepository;
  envoieEmailService: EnvoieEmailService;
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery;
  exportCsvDesChantiersUseCase: ExportCsvDesChantiersUseCase;
  récupérerStatistiquesAvancementChantiersUseCase: RécupérerStatistiquesAvancementChantiersUseCase;
  exportCsvDesIndicateursUseCase: ExportCsvDesIndicateursUseCase;
  exportCsvDesHistoriquesIndicateursUseCase: ExportCsvDesHistoriquesIndicateursUseCase;
  recupererDetailsIndicateursV2UseCase: RecupererDetailsIndicateursV2UseCase;
  recupererChantiersAccessiblesEnLectureUseCaseV2: RecupererChantiersAccessiblesEnLectureUseCaseV2;
  recupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2: RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2;
  recupererChantierUseCaseV2: RecupererChantierUseCaseV2;
  listerDetailsIndicateurTerritoireUseCaseV2: ListerDetailsIndicateurTerritoireUseCaseV2;
  rapportPropositionsAvancementRepository: RapportPropositionsAvancementRepository;
  creerLesRapportsPropositionsUseCase: CreerLesRapportsPropositionsUseCase;
  envoyerLesRapportsPropositionsUseCase: EnvoyerLesRapportsPropositionsUseCase;
  getChantierMeteosTerritoiresQuery: GetChantierMeteosTerritoiresQuery;
  getChantierPVACountTerritoiresQuery: GetChantierPVACountTerritoiresQuery;
  getIndicateurPVACountTerritoiresQuery: GetIndicateurPVACountTerritoiresQuery;
  recupererTauxAvancementsChantierTerritoiresQuery: RecupererTauxAvancementsChantierTerritoiresQuery;
  recupererValeursAvancementIndicateurTerritoiresQuery: RecupererValeursAvancementIndicateurTerritoiresQuery;
  getValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery: GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery;
  recupererTauxAvancementIndicateurTerritoiresQuery: RecupererTauxAvancementIndicateurTerritoiresQuery;
  getStatistiquesTauxAvancementIndicateurTerritoiresQuery: GetStatistiquesTauxAvancementIndicateurTerritoiresQuery;
  getStatistiquesAvancementChantiersQuery: GetStatistiquesAvancementChantiersQuery;
  getStatistiquesAvancementChantiersParChantierQuery: GetStatistiquesAvancementChantiersParChantierQuery;
  getRepartitionMeteoChantiersQuery: GetRepartitionMeteoChantiersQuery;
  getChantiersSignalesQuery: GetChantiersSignalesQuery;
  recupererEvolutionValeursAvancementTerritoiresQuery: RecupererEvolutionValeursAvancementTerritoiresQuery;
  recupererEvolutionTauxAvancementTerritoiresQuery: RecupererEvolutionTauxAvancementTerritoiresQuery;
};

type ChantierCradle = ChantierOwnCradle & ChantierImports;

export const chantiersModule = defineModule<ChantierExports, ChantierCradle>()({
  name: "chantiers",
  imports: [
    "shared",
    "indicateurTerritoireValeurEvenement",
    "datajobsExecution",
    "legacy",
  ],
  exports: ["recupererChantiersQuery", "mesuresIndicateurQuery"],
  register: (container, { asModuleClass }) => {
    container.register({
      chantierRepository: asModuleClass(PrismaChantierRepository),
      indicateurRepository: asModuleClass(PrismaIndicateurRepository),
      territoireRepository: asModuleClass(PrismaTerritoireRepository),
      ministereRepository: asModuleClass(PrismaMinistereRepository),
      utilisateurRepository: asModuleClass(PrismaUtilisateurRepository),
      envoieEmailService: asModuleClass(BrevoEnvoieEmailService),
      recupererDonneesChantierQuery: asModuleClass(
        RecupererDonneesChantierQuery,
      ),
      exportCsvDesChantiersUseCase: asModuleClass(ExportCsvDesChantiersUseCase),
      récupérerStatistiquesAvancementChantiersUseCase: asModuleClass(
        RécupérerStatistiquesAvancementChantiersUseCase,
      ),
      exportCsvDesIndicateursUseCase: asModuleClass(
        ExportCsvDesIndicateursUseCase,
      ),
      exportCsvDesHistoriquesIndicateursUseCase: asModuleClass(
        ExportCsvDesHistoriquesIndicateursUseCase,
      ),
      rapportPropositionsAvancementRepository: asModuleClass(
        PrismaRapportPropositionsAvancementRepository,
      ),
      creerLesRapportsPropositionsUseCase: asModuleClass(
        CreerLesRapportsPropositionsUseCase,
      ),
      envoyerLesRapportsPropositionsUseCase: asModuleClass(
        EnvoyerLesRapportsPropositionsUseCase,
      ),
      recupererDetailsIndicateursV2UseCase: asModuleClass(
        RecupererDetailsIndicateursV2UseCase,
      ),
      recupererChantiersAccessiblesEnLectureUseCaseV2: asModuleClass(
        RecupererChantiersAccessiblesEnLectureUseCaseV2,
      ),
      recupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2:
        asModuleClass(
          RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2,
        ),
      recupererChantierUseCaseV2: asModuleClass(RecupererChantierUseCaseV2),
      listerDetailsIndicateurTerritoireUseCaseV2: asModuleClass(
        ListerDetailsIndicateurTerritoireUseCaseV2,
      ),
      recupererChantiersQuery: asModuleClass(
        RecupererChantiersApplicablesParTerritoiresQuery,
      ),
      mesuresIndicateurQuery: asModuleClass(
        RecupererMesuresIndicateurParPeriodeQuery,
      ),
      getChantierMeteosTerritoiresQuery: asModuleClass(
        GetChantierMeteosTerritoiresQuery,
      ),
      getChantierPVACountTerritoiresQuery: asModuleClass(
        GetChantierPVACountTerritoiresQuery,
      ),
      getIndicateurPVACountTerritoiresQuery: asModuleClass(
        GetIndicateurPVACountTerritoiresQuery,
      ),
      recupererTauxAvancementsChantierTerritoiresQuery: asModuleClass(
        RecupererTauxAvancementsChantierTerritoiresQuery,
      ),
      recupererValeursAvancementIndicateurTerritoiresQuery: asModuleClass(
        RecupererValeursAvancementIndicateurTerritoiresQuery,
      ),
      getValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery:
        asModuleClass(
          GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery,
        ),
      recupererTauxAvancementIndicateurTerritoiresQuery: asModuleClass(
        RecupererTauxAvancementIndicateurTerritoiresQuery,
      ),
      getStatistiquesTauxAvancementIndicateurTerritoiresQuery: asModuleClass(
        GetStatistiquesTauxAvancementIndicateurTerritoiresQuery,
      ),
      getStatistiquesAvancementChantiersQuery: asModuleClass(
        GetStatistiquesAvancementChantiersQuery,
      ),
      getStatistiquesAvancementChantiersParChantierQuery: asModuleClass(
        GetStatistiquesAvancementChantiersParChantierQuery,
      ),
      getRepartitionMeteoChantiersQuery: asModuleClass(
        GetRepartitionMeteoChantiersQuery,
      ),
      getChantiersSignalesQuery: asModuleClass(GetChantiersSignalesQuery),
      recupererEvolutionValeursAvancementTerritoiresQuery: asModuleClass(
        RecupererEvolutionValeursAvancementTerritoiresQuery,
      ),
      recupererEvolutionTauxAvancementTerritoiresQuery: asModuleClass(
        RecupererEvolutionTauxAvancementTerritoiresQuery,
      ),
    } satisfies VerifyCradle<ChantierOwnCradle>);
  },
});

export type { ChantierExports };
type Scope = ExtractScope<typeof chantiersModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

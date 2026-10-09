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
import ChantierSQLRepositoryInterface from "@/server/domain/chantier/ChantierRepository.interface";
import AxeSQLRepositoryInterface from "@/server/domain/axe/AxeRepository.interface";
import SynthèseDesRésultatsSQLRepositoryInterface from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import MinistèreSQLRepositoryInterface from "@/server/domain/ministère/MinistèreRepository.interface";
import IndicateurSQLRepositoryInterface from "@/server/domain/indicateur/IndicateurRepository.interface";
import CommentaireSQLRepositoryInterface from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import ObjectifSQLRepositoryInterface from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import DécisionStratégiqueSQLRepositoryInterface from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import TerritoireSQLRepositoryInterface from "@/server/domain/territoire/TerritoireRepository.interface";
import ChantierSQLRepository from "@/server/infrastructure/accès_données/chantier/ChantierSQLRepository";
import AxeSQLRepository from "@/server/infrastructure/accès_données/axe/AxeSQLRepository";
import MinistèreSQLRepository from "@/server/infrastructure/accès_données/ministère/MinistèreSQLRepository";
import IndicateurSQLRepository from "@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { TerritoireSQLRepository } from "@/server/infrastructure/accès_données/territoire/TerritoireSQLRepository";
import { RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase } from "@/server/chantiers/usecases/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase";
import { RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase } from "@/server/chantiers/usecases/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase";
import { RecupererRepartitionsMeteoChantiersUseCase } from "@/server/chantiers/usecases/RecupererRepartitionMeteoChantiersUseCase";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import { TerritoireRepository } from "./domain/ports/TerritoireRepository";
import { PrismaTerritoireRepository } from "./infrastructure/adapters/PrismaTerritoireRepository";
import { UtilisateurRepository } from "./domain/ports/UtilisateurRepository";
import { PrismaUtilisateurRepository } from "./infrastructure/adapters/PrismaUtilisateurRepository";
import { EnvoieEmailService } from "./domain/ports/EnvoieEmailService";
import { BrevoEnvoieEmailService } from "./infrastructure/adapters/BrevoEnvoieEmailService";
import { RecupererDetailsIndicateursUseCase } from "./usecases/RecupererDetailsIndicateursUseCase";
import { RecupererChantiersAccessiblesEnLectureUseCaseV2 } from "./usecases/RecupererChantiersAccessiblesEnLectureUseCaseV2";
import RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2 from "./usecases/RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2";
import { ExportCsvDesChantiersUseCase } from "./usecases/ExportCsvDesChantiersUseCase";
import { ListerDonneesIndicateurParIndicIdUseCase } from "./usecases/ListerDonneesIndicateurParIndicIdUseCase";
import { RécupérerStatistiquesAvancementChantiersUseCase } from "./usecases/RécupérerStatistiquesAvancementChantiersUseCase";
import { ExportCsvDesIndicateursUseCase } from "./usecases/ExportCsvDesIndicateursUseCase";
import { ExportCsvDesHistoriquesIndicateursUseCase } from "./usecases/ExportCsvDesHistoriquesIndicateursUseCase";
import { MinistereRepository } from "./domain/ports/MinistereRepository";
import PrismaMinistereRepository from "./infrastructure/adapters/PrismaMinistereRepository";
import RecupererChantierUseCase from "./usecases/RecupererChantierUseCase";
import { ListerDetailsIndicateurTerritoireUseCase } from "./usecases/ListerDetailsIndicateurTerritoireUseCase";
import { RapportPropositionsAvancementRepository } from "./domain/ports/RapportPropositionsAvancementRepository";
import { PrismaRapportPropositionsAvancementRepository } from "./infrastructure/adapters/PrismaRapportPropositionsAvancementRepository";
import { CreerLesRapportsPropositionsUseCase } from "./usecases/CreerLesRapportsPropositionsUseCase";
import { EnvoyerLesRapportsPropositionsUseCase } from "./usecases/EnvoyerLesRapportsPropositionsUseCase";
import { RapportResponsableDonneesRepository } from "./domain/ports/RapportResponsableDonneesRepository";
import { PrismaRapportResponsableDonneesRepository } from "./infrastructure/adapters/PrismaRapportResponsableDonneesRepository";
import { CreerLesRapportsResponsablesDonneesUseCase } from "./usecases/CreerLesRapportsResponsablesDonneesUseCase";
import { EnvoyerLesRapportsResponsablesDonneesUseCase } from "./usecases/EnvoyerLesRapportsResponsablesDonneesUseCase";
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
import { GetChantiersSignalesDetailQuery } from "./infrastructure/queries/GetChantiersSignalesDetailQuery";
import { RecupererIndicateursNonAJourQuery } from "./infrastructure/queries/RecupererIndicateursNonAJourQuery";
import { VerifierIndicateursDemandesQuery } from "./infrastructure/queries/VerifierIndicateursDemandesQuery";
import { ChantiersSignalesDataFetcher } from "./infrastructure/queries/ChantiersSignalesDataFetcher";
import { GetStatistiquesAvancementChantiersQuery } from "./infrastructure/queries/GetStatistiquesAvancementChantiersQuery";
import { GetStatistiquesAvancementChantiersParChantierQuery } from "./infrastructure/queries/GetStatistiquesAvancementChantiersParChantierQuery";
import { RecupererEvolutionValeursAvancementTerritoiresQuery } from "./infrastructure/queries/RecupererEvolutionValeursAvancementTerritoiresQuery";
import { RecupererEvolutionTauxAvancementTerritoiresQuery } from "./infrastructure/queries/RecupererEvolutionTauxAvancementTerritoiresQuery";
import { GetAvancementChantierQuery } from "./infrastructure/queries/GetAvancementChantierQuery";
import { GetSituationChantierQuery } from "./infrastructure/queries/GetSituationChantierQuery";
import { GetChantiersQuery } from "./query/GetChantiersQuery";
import { GetChantierIndicateursQuery } from "./query/GetChantierIndicateursQuery";
import { GetChantierCommentairesQuery } from "./query/GetChantierCommentairesQuery";
import { GetChantiersIdentiteQuery } from "./query/GetChantiersIdentiteQuery";
import { GetIndicateursIdentiteQuery } from "./query/GetIndicateursIdentiteQuery";
import { GetIndicateurContexteQuery } from "./query/GetIndicateurContexteQuery";
import { GetEvolutionIndicateurTerritoireQuery } from "./query/GetEvolutionIndicateurTerritoireQuery";
import { GetHistoriqueIndicateurTerritoireQuery } from "./query/GetHistoriqueIndicateurTerritoireQuery";
import { GetTerritoiresIdentiteQuery } from "./query/GetTerritoiresIdentiteQuery";
import { RecupererTauxAvancementTerritoireQuery } from "./query/RecupererTauxAvancementTerritoireQuery";
import { RecupererStatistiquesAvancementTousChantiersPubliesQuery } from "./query/RecupererStatistiquesAvancementTousChantiersPubliesQuery";
import { GetChantiersHabilitesQuery } from "./infrastructure/queries/GetChantiersHabilitesQuery";
import { GetChantierObjectifsQuery } from "./query/GetChantierObjectifsQuery";

type ChantierExports = {
  recupererChantiersQuery: RecupererChantiersApplicablesParTerritoiresQuery;
  mesuresIndicateurQuery: RecupererMesuresIndicateurParPeriodeQuery;
  getChantiersQuery: GetChantiersQuery;
  getChantierIndicateursQuery: GetChantierIndicateursQuery;
  getChantierCommentairesQuery: GetChantierCommentairesQuery;
  getChantierObjectifsQuery: GetChantierObjectifsQuery;
  getChantiersIdentiteQuery: GetChantiersIdentiteQuery;
  getIndicateursIdentiteQuery: GetIndicateursIdentiteQuery;
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
  getEvolutionIndicateurTerritoireQuery: GetEvolutionIndicateurTerritoireQuery;
  getHistoriqueIndicateurTerritoireQuery: GetHistoriqueIndicateurTerritoireQuery;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
  getChantiersSignalesDetailQuery: GetChantiersSignalesDetailQuery;
  recupererIndicateursNonAJourQuery: RecupererIndicateursNonAJourQuery;
  verifierIndicateursDemandesQuery: VerifierIndicateursDemandesQuery;
};

type ChantierImports = IndicateurTerritoireValeurEvenementExports &
  DatajobsExecutionExports;

type ChantierOwnCradle = ChantierExports & {
  chantierSQLRepository: ChantierSQLRepositoryInterface;
  axeSQLRepository: AxeSQLRepositoryInterface;
  synthèseDesRésultatsSQLRepository: SynthèseDesRésultatsSQLRepositoryInterface;
  ministèreSQLRepository: MinistèreSQLRepositoryInterface;
  indicateurSQLRepository: IndicateurSQLRepositoryInterface;
  commentaireSQLRepository: CommentaireSQLRepositoryInterface;
  objectifSQLRepository: ObjectifSQLRepositoryInterface;
  décisionStratégiqueSQLRepository: DécisionStratégiqueSQLRepositoryInterface;
  territoireSQLRepository: TerritoireSQLRepositoryInterface;
  agregerAvancementsChantiersUseCase: AgregerAvancementsChantiersUseCase;
  recupererRepartitionsMeteoChantiersUseCase: RecupererRepartitionsMeteoChantiersUseCase;
  récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase;
  récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase;
  listerDonneesIndicateurParIndicIdUseCase: ListerDonneesIndicateurParIndicIdUseCase;
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
  recupererDetailsIndicateursUseCase: RecupererDetailsIndicateursUseCase;
  recupererChantiersAccessiblesEnLectureUseCaseV2: RecupererChantiersAccessiblesEnLectureUseCaseV2;
  recupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2: RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2;
  recupererChantierUseCase: RecupererChantierUseCase;
  listerDetailsIndicateurTerritoireUseCase: ListerDetailsIndicateurTerritoireUseCase;
  rapportPropositionsAvancementRepository: RapportPropositionsAvancementRepository;
  creerLesRapportsPropositionsUseCase: CreerLesRapportsPropositionsUseCase;
  envoyerLesRapportsPropositionsUseCase: EnvoyerLesRapportsPropositionsUseCase;
  rapportResponsableDonneesRepository: RapportResponsableDonneesRepository;
  creerLesRapportsResponsablesDonneesUseCase: CreerLesRapportsResponsablesDonneesUseCase;
  envoyerLesRapportsResponsablesDonneesUseCase: EnvoyerLesRapportsResponsablesDonneesUseCase;
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
  chantiersSignalesDataFetcher: ChantiersSignalesDataFetcher;
  recupererEvolutionValeursAvancementTerritoiresQuery: RecupererEvolutionValeursAvancementTerritoiresQuery;
  recupererEvolutionTauxAvancementTerritoiresQuery: RecupererEvolutionTauxAvancementTerritoiresQuery;
  getAvancementChantierQuery: GetAvancementChantierQuery;
  getSituationChantierQuery: GetSituationChantierQuery;
  recupererTauxAvancementTerritoireQuery: RecupererTauxAvancementTerritoireQuery;
  recupererStatistiquesAvancementTousChantiersPubliesQuery: RecupererStatistiquesAvancementTousChantiersPubliesQuery;
  getChantiersHabilitesQuery: GetChantiersHabilitesQuery;
};

type ChantierCradle = ChantierOwnCradle & ChantierImports;

export const chantiersModule = defineModule<ChantierExports, ChantierCradle>()({
  name: "chantiers",
  imports: [
    "framework",
    "indicateurTerritoireValeurEvenement",
    "datajobsExecution",
  ],
  exports: [
    "recupererChantiersQuery",
    "mesuresIndicateurQuery",
    "getChantiersQuery",
    "getChantierIndicateursQuery",
    "getChantierCommentairesQuery",
    "getChantierObjectifsQuery",
    "getChantiersIdentiteQuery",
    "getIndicateursIdentiteQuery",
    "getIndicateurContexteQuery",
    "getEvolutionIndicateurTerritoireQuery",
    "getHistoriqueIndicateurTerritoireQuery",
    "getTerritoiresIdentiteQuery",
    "getChantiersSignalesDetailQuery",
    "recupererIndicateursNonAJourQuery",
    "verifierIndicateursDemandesQuery",
  ],
  register: (container, { asModuleClass, asModuleFunction }) => {
    container.register({
      chantierSQLRepository: asModuleClass(ChantierSQLRepository).scoped(),
      axeSQLRepository: asModuleClass(AxeSQLRepository).scoped(),
      synthèseDesRésultatsSQLRepository: asModuleClass(
        SynthèseDesRésultatsSQLRepository,
      ).scoped(),
      ministèreSQLRepository: asModuleClass(MinistèreSQLRepository).scoped(),
      indicateurSQLRepository: asModuleClass(IndicateurSQLRepository).scoped(),
      commentaireSQLRepository: asModuleClass(
        CommentaireSQLRepository,
      ).scoped(),
      objectifSQLRepository: asModuleClass(ObjectifSQLRepository).scoped(),
      décisionStratégiqueSQLRepository: asModuleClass(
        DécisionStratégiqueSQLRepository,
      ).scoped(),
      territoireSQLRepository: asModuleClass(TerritoireSQLRepository).scoped(),
      agregerAvancementsChantiersUseCase: asModuleFunction(
        ({ chantierSQLRepository }) =>
          new AgregerAvancementsChantiersUseCase({
            chantierRepository: chantierSQLRepository,
          }),
      ).scoped(),
      recupererRepartitionsMeteoChantiersUseCase: asModuleFunction(
        ({ chantierSQLRepository }) =>
          new RecupererRepartitionsMeteoChantiersUseCase({
            chantierRepository: chantierSQLRepository,
          }),
      ).scoped(),
      récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase:
        asModuleFunction(
          ({ commentaireSQLRepository }) =>
            new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(
              { commentaireRepository: commentaireSQLRepository },
            ),
        ).scoped(),
      récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase:
        asModuleFunction(
          ({ objectifSQLRepository }) =>
            new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase(
              { objectifRepository: objectifSQLRepository },
            ),
        ).scoped(),
      listerDonneesIndicateurParIndicIdUseCase: asModuleClass(
        ListerDonneesIndicateurParIndicIdUseCase,
      ),
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
      rapportResponsableDonneesRepository: asModuleClass(
        PrismaRapportResponsableDonneesRepository,
      ),
      creerLesRapportsResponsablesDonneesUseCase: asModuleClass(
        CreerLesRapportsResponsablesDonneesUseCase,
      ),
      envoyerLesRapportsResponsablesDonneesUseCase: asModuleClass(
        EnvoyerLesRapportsResponsablesDonneesUseCase,
      ),
      recupererDetailsIndicateursUseCase: asModuleClass(
        RecupererDetailsIndicateursUseCase,
      ),
      recupererChantiersAccessiblesEnLectureUseCaseV2: asModuleClass(
        RecupererChantiersAccessiblesEnLectureUseCaseV2,
      ),
      recupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2:
        asModuleClass(
          RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2,
        ),
      recupererChantierUseCase: asModuleClass(RecupererChantierUseCase),
      listerDetailsIndicateurTerritoireUseCase: asModuleClass(
        ListerDetailsIndicateurTerritoireUseCase,
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
      chantiersSignalesDataFetcher: asModuleClass(ChantiersSignalesDataFetcher),
      getChantiersSignalesQuery: asModuleClass(GetChantiersSignalesQuery),
      getChantiersSignalesDetailQuery: asModuleClass(
        GetChantiersSignalesDetailQuery,
      ),
      recupererIndicateursNonAJourQuery: asModuleClass(
        RecupererIndicateursNonAJourQuery,
      ),
      verifierIndicateursDemandesQuery: asModuleClass(
        VerifierIndicateursDemandesQuery,
      ),
      recupererEvolutionValeursAvancementTerritoiresQuery: asModuleClass(
        RecupererEvolutionValeursAvancementTerritoiresQuery,
      ),
      recupererEvolutionTauxAvancementTerritoiresQuery: asModuleClass(
        RecupererEvolutionTauxAvancementTerritoiresQuery,
      ),
      getAvancementChantierQuery: asModuleClass(GetAvancementChantierQuery),
      getSituationChantierQuery: asModuleClass(GetSituationChantierQuery),
      getChantiersQuery: asModuleClass(GetChantiersQuery),
      getChantierIndicateursQuery: asModuleClass(GetChantierIndicateursQuery),
      getChantierCommentairesQuery: asModuleClass(GetChantierCommentairesQuery),
      getChantierObjectifsQuery: asModuleClass(GetChantierObjectifsQuery),
      getChantiersIdentiteQuery: asModuleClass(GetChantiersIdentiteQuery),
      getIndicateursIdentiteQuery: asModuleClass(GetIndicateursIdentiteQuery),
      getIndicateurContexteQuery: asModuleClass(GetIndicateurContexteQuery),
      getEvolutionIndicateurTerritoireQuery: asModuleClass(
        GetEvolutionIndicateurTerritoireQuery,
      ),
      getHistoriqueIndicateurTerritoireQuery: asModuleClass(
        GetHistoriqueIndicateurTerritoireQuery,
      ),
      getTerritoiresIdentiteQuery: asModuleClass(GetTerritoiresIdentiteQuery),
      recupererTauxAvancementTerritoireQuery: asModuleClass(
        RecupererTauxAvancementTerritoireQuery,
      ),
      recupererStatistiquesAvancementTousChantiersPubliesQuery: asModuleClass(
        RecupererStatistiquesAvancementTousChantiersPubliesQuery,
      ),
      getChantiersHabilitesQuery: asModuleClass(GetChantiersHabilitesQuery),
    } satisfies VerifyCradle<ChantierOwnCradle>);
  },
});

export type { ChantierExports };
type Scope = ExtractScope<typeof chantiersModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

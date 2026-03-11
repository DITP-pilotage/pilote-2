import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { RecupererDonneesChantierQuery } from "@/server/chantiers/infrastructure/queries/RecupererDonneesChantierQuery";
import { RecupererChantiersApplicablesParTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererChantiersApplicablesParTerritoiresQuery";
import { RecupererMesuresIndicateurParPeriodeQuery } from "@/server/chantiers/infrastructure/queries/RecupererMesuresIndicateurParPeriodeQuery";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { PropositionValeurAvancementRepository } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { PrismaPropositionValeurAvancementRepository } from "@/server/chantiers/infrastructure/adapters/PrismaPropositionValeurAvancementRepository";
import type { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import { defineModule, type ModuleScope } from "@/server/module-system";
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

type ChantierExports = {
  recupererChantiersQuery: RecupererChantiersApplicablesParTerritoiresQuery;
  mesuresIndicateurQuery: RecupererMesuresIndicateurParPeriodeQuery;
};

type ChantierCradle = ChantierExports & {
  chantierRepository: ChantierRepository;
  indicateurRepository: IndicateurRepository;
  territoireRepository: TerritoireRepository;
  ministereRepository: MinistereRepository;
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository;
  utilisateurRepository: UtilisateurRepository;
  envoieEmailService: EnvoieEmailService;
  recupererDonneesChantierQuery: RecupererDonneesChantierQuery;
  exportCsvDesChantiersUseCase: ExportCsvDesChantiersUseCase;
  exportCsvDesIndicateursUseCase: ExportCsvDesIndicateursUseCase;
  exportCsvDesHistoriquesIndicateursUseCase: ExportCsvDesHistoriquesIndicateursUseCase;
  recupererDetailsIndicateursV2UseCase: RecupererDetailsIndicateursV2UseCase;
  recupererChantiersAccessiblesEnLectureUseCaseV2: RecupererChantiersAccessiblesEnLectureUseCaseV2;
  recupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2: RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2;
  recupererChantierUseCaseV2: RecupererChantierUseCaseV2;
  listerDetailsIndicateurTerritoireUseCaseV2: ListerDetailsIndicateurTerritoireUseCaseV2;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  datajobsExecutionQueries: DatajobsExecutionQueries;
  rapportPropositionsAvancementRepository: RapportPropositionsAvancementRepository;
  creerLesRapportsPropositionsUseCase: CreerLesRapportsPropositionsUseCase;
  envoyerLesRapportsPropositionsUseCase: EnvoyerLesRapportsPropositionsUseCase;
};

export const chantiersModule = defineModule<ChantierExports, ChantierCradle>()({
  name: "chantiers",
  imports: ["shared", "indicateurTerritoireValeurEvenement"],
  exports: ["recupererChantiersQuery", "mesuresIndicateurQuery"],
  register: (container, { asModuleClass }) => {
    container.register({
      chantierRepository: asModuleClass(PrismaChantierRepository),
      indicateurRepository: asModuleClass(PrismaIndicateurRepository),
      territoireRepository: asModuleClass(PrismaTerritoireRepository),
      ministereRepository: asModuleClass(PrismaMinistereRepository),
      propositionValeurAvancementRepository: asModuleClass(
        PrismaPropositionValeurAvancementRepository,
      ),
      utilisateurRepository: asModuleClass(PrismaUtilisateurRepository),
      envoieEmailService: asModuleClass(BrevoEnvoieEmailService),
      recupererDonneesChantierQuery: asModuleClass(
        RecupererDonneesChantierQuery,
      ),
      exportCsvDesChantiersUseCase: asModuleClass(ExportCsvDesChantiersUseCase),
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
      datajobsExecutionQueries: asModuleClass(DatajobsExecutionQueries),
      recupererChantiersQuery: asModuleClass(
        RecupererChantiersApplicablesParTerritoiresQuery,
      ),
      mesuresIndicateurQuery: asModuleClass(
        RecupererMesuresIndicateurParPeriodeQuery,
      ),
    });
  },
});

type Scope = ModuleScope<ChantierCradle>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

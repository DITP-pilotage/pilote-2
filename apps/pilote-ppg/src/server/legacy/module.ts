import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import AxeRepository from "@/server/domain/axe/AxeRepository.interface";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import MinistèreRepository from "@/server/domain/ministère/MinistèreRepository.interface";
import IndicateurRepository from "@/server/domain/indicateur/IndicateurRepository.interface";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import TerritoireRepository from "@/server/domain/territoire/TerritoireRepository.interface";
import { IndicateurRepository as ChantierIndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import ProfilRepository from "@/server/domain/profil/ProfilRepository";
import { RapportRepository } from "@/server/import-indicateur/domain/ports/RapportRepository";
import { IndicateurRepository as ImportIndicateurRepository } from "@/server/import-indicateur/domain/ports/IndicateurRepository";
import ChantierSQLRepository from "@/server/infrastructure/accès_données/chantier/ChantierSQLRepository";
import AxeSQLRepository from "@/server/infrastructure/accès_données/axe/AxeSQLRepository";
import MinistèreSQLRepository from "@/server/infrastructure/accès_données/ministère/MinistèreSQLRepository";
import IndicateurSQLRepository from "@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { UtilisateurSQLRepository } from "@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository";
import { TerritoireSQLRepository } from "@/server/infrastructure/accès_données/territoire/TerritoireSQLRepository";
import { PrismaIndicateurRepository as PrismaChantierIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import ProfilSQLRepository from "@/server/infrastructure/accès_données/profil/ProfilSQLRepository";
import { PrismaRapportRepository } from "@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository";
import { PrismaIndicateurRepository } from "@/server/import-indicateur/infrastructure/adapters/PrismaIndicateurRepository";
import { RecupererRepartitionsMeteoChantiersUseCase } from "@/server/chantiers/usecases/RecupererRepartitionMeteoChantiersUseCase";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase";
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase";
import RécupérerUnUtilisateurUseCase from "@/server/gestion-utilisateur/usecases/RécupérerUnUtilisateurUseCase";
import RécupérerUnProfilUseCase from "@/server/usecase/profil/RécupérerUnProfilUseCase";
import { RécupérerTerritoiresAvecNombreUtilisateursUseCase } from "@/server/usecase/territoire/RécupérerTerritoiresAvecNombreUtilisateursUseCase";
import { ListerDonneesIndicateurParIndicIdUseCase } from "@/server/chantiers/usecases/ListerDonneesIndicateurParIndicIdUseCase";
import type { GestionContenuExports } from "@/server/gestion-contenu/module";
import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";

export type LegacyExport = {
  agregerAvancementsChantiersUseCase: AgregerAvancementsChantiersUseCase;
};

type LegacyOwnCradle = LegacyExport & {
  chantierRepository: ChantierRepository;
  axeRepository: AxeRepository;
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
  ministèreRepository: MinistèreRepository;
  indicateurRepository: IndicateurRepository;
  commentaireRepository: CommentaireRepository;
  objectifRepository: ObjectifRepository;
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
  utilisateurRepository: UtilisateurRepository;
  territoireRepository: TerritoireRepository;
  chantierIndicateurRepository: ChantierIndicateurRepository;
  profilRepository: ProfilRepository;
  rapportRepository: RapportRepository;
  importIndicateurRepository: ImportIndicateurRepository;
  recupererRepartitionsMeteoChantiersUseCase: RecupererRepartitionsMeteoChantiersUseCase;
  récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase;
  récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase;
  récupérerUnUtilisateurUseCase: RécupérerUnUtilisateurUseCase;
  récupérerUnProfilUseCase: RécupérerUnProfilUseCase;
  récupérerTerritoiresAvecNombreUtilisateursUseCase: RécupérerTerritoiresAvecNombreUtilisateursUseCase;
  listerDonneesIndicateurParIndicIdUseCase: ListerDonneesIndicateurParIndicIdUseCase;
};

type LegacyCradle = LegacyOwnCradle & GestionContenuExports;

export const legacyModule = defineModule<LegacyExport, LegacyCradle>()({
  name: "legacy",
  imports: ["shared", "gestionContenu"],
  exports: ["agregerAvancementsChantiersUseCase"],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      chantierRepository: asModuleClass(ChantierSQLRepository).scoped(),
      axeRepository: asModuleClass(AxeSQLRepository).scoped(),
      synthèseDesRésultatsRepository: asModuleClass(
        SynthèseDesRésultatsSQLRepository,
      ).scoped(),
      ministèreRepository: asModuleClass(MinistèreSQLRepository).scoped(),
      indicateurRepository: asModuleClass(IndicateurSQLRepository).scoped(),
      commentaireRepository: asModuleClass(CommentaireSQLRepository).scoped(),
      objectifRepository: asModuleClass(ObjectifSQLRepository).scoped(),
      décisionStratégiqueRepository: asModuleClass(
        DécisionStratégiqueSQLRepository,
      ).scoped(),
      utilisateurRepository: asModuleClass(UtilisateurSQLRepository).scoped(),
      territoireRepository: asModuleClass(TerritoireSQLRepository).scoped(),
      chantierIndicateurRepository: asModuleClass(
        PrismaChantierIndicateurRepository,
      ).scoped(),
      profilRepository: asModuleClass(ProfilSQLRepository).scoped(),
      rapportRepository: asModuleClass(PrismaRapportRepository).scoped(),
      importIndicateurRepository: asModuleClass(
        PrismaIndicateurRepository,
      ).scoped(),
      recupererRepartitionsMeteoChantiersUseCase: asModuleClass(
        RecupererRepartitionsMeteoChantiersUseCase,
      ).scoped(),
      agregerAvancementsChantiersUseCase: asModuleClass(
        AgregerAvancementsChantiersUseCase,
      ).scoped(),
      récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase:
        asModuleClass(
          RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase,
        ).scoped(),
      récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase:
        asModuleClass(
          RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase,
        ).scoped(),
      récupérerUnUtilisateurUseCase: asModuleClass(
        RécupérerUnUtilisateurUseCase,
      ).scoped(),
      récupérerUnProfilUseCase: asModuleClass(
        RécupérerUnProfilUseCase,
      ).scoped(),
      récupérerTerritoiresAvecNombreUtilisateursUseCase: asModuleClass(
        RécupérerTerritoiresAvecNombreUtilisateursUseCase,
      ).scoped(),
      listerDonneesIndicateurParIndicIdUseCase: asModuleFunction(
        ({ chantierIndicateurRepository }) =>
          new ListerDonneesIndicateurParIndicIdUseCase({
            indicateurRepository: chantierIndicateurRepository,
          }),
      ).scoped(),
    } satisfies VerifyCradle<LegacyOwnCradle>);
  },
});

type Scope = ExtractScope<typeof legacyModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

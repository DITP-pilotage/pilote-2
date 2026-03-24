import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import AxeRepository from "@/server/domain/axe/AxeRepository.interface";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import MinistèreRepository from "@/server/domain/ministère/MinistèreRepository.interface";
import IndicateurRepository from "@/server/domain/indicateur/IndicateurRepository.interface";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import { UtilisateurRepository as AuthentificationUtilisateurRepository } from "@/server/authentification/domain/ports/UtilisateurRepository";
import { ProfilRepository as AuthentificationProfilRepository } from "@/server/authentification/domain/ports/ProfilRepository";
import TerritoireRepository from "@/server/domain/territoire/TerritoireRepository.interface";
import { TerritoireRepository as FicheTerritorialeTerritoireRepository } from "@/server/fiche-territoriale/domain/ports/TerritoireRepository";
import { ChantierRepository as FicheTerritorialeChantierRepository } from "@/server/fiche-territoriale/domain/ports/ChantierRepository";
import { IndicateurRepository as FicheTerritorialeIndicateurRepository } from "@/server/fiche-territoriale/domain/ports/IndicateurRepository";
import { SyntheseDesResultatsRepository as FicheTerritorialeSyntheseDesResultatsRepository } from "@/server/fiche-territoriale/domain/ports/SyntheseDesResultatsRepository";
import { MinistereRepository as FicheTerritorialeMinistereRepository } from "@/server/fiche-territoriale/domain/ports/MinistereRepository";
import { IndicateurRepository as ChantierIndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import ProfilRepository from "@/server/domain/profil/ProfilRepository";
import { RapportRepository } from "@/server/import-indicateur/domain/ports/RapportRepository";
import { IndicateurRepository as ImportIndicateurRepository } from "@/server/import-indicateur/domain/ports/IndicateurRepository";
import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import { TokenAPIService } from "@/server/authentification/domain/ports/TokenAPIService";
import { TokenAPIInformationRepository } from "@/server/authentification/domain/ports/TokenAPIInformationRepository";
import ChantierSQLRepository from "@/server/infrastructure/accès_données/chantier/ChantierSQLRepository";
import AxeSQLRepository from "@/server/infrastructure/accès_données/axe/AxeSQLRepository";
import MinistèreSQLRepository from "@/server/infrastructure/accès_données/ministère/MinistèreSQLRepository";
import IndicateurSQLRepository from "@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { UtilisateurSQLRepository } from "@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository";
import { PrismaUtilisateurRepository } from "@/server/authentification/infrastructure/adapters/PrismaUtilisateurRepository";
import { PrismaProfilRepository } from "@/server/authentification/infrastructure/adapters/PrismaProfilRepository";
import { TerritoireSQLRepository } from "@/server/infrastructure/accès_données/territoire/TerritoireSQLRepository";
import { PrismaTerritoireRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaTerritoireRepository";
import { PrismaChantierRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaChantierRepository";
import { PrismaIndicateurRepository as PrismaFicheTerritorialeIndicateurRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaIndicateurRepository";
import { PrismaSyntheseDesResultatsRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaSyntheseDesResultatsRepository";
import { PrismaMinistereRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaMinistereRepository";
import { PrismaIndicateurRepository as PrismaChantierIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import ProfilSQLRepository from "@/server/infrastructure/accès_données/profil/ProfilSQLRepository";
import { PrismaRapportRepository } from "@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository";
import { PrismaIndicateurRepository } from "@/server/import-indicateur/infrastructure/adapters/PrismaIndicateurRepository";
import { PrismaGestionContenuRepository } from "@/server/gestion-contenu/infrastructure/adapters/PrismaGestionContenuRepository";
import { TokenAPIJWTService } from "@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService";
import { PrismaTokenAPIInformationRepository } from "@/server/authentification/infrastructure/adapters/PrismaTokenAPIInformationRepository";
import { configuration } from "@/config";
import RécupérerStatistiquesAvancementChantiersUseCase from "@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase";
import { RecupererRepartitionsMeteoChantiersUseCase } from "@/server/chantiers/usecases/RecupererRepartitionMeteoChantiersUseCase";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase";
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase";
import RécupérerUnUtilisateurUseCase from "@/server/gestion-utilisateur/usecases/RécupérerUnUtilisateurUseCase";
import RécupérerUnProfilUseCase from "@/server/usecase/profil/RécupérerUnProfilUseCase";
import { RécupérerTerritoiresAvecNombreUtilisateursUseCase } from "@/server/usecase/territoire/RécupérerTerritoiresAvecNombreUtilisateursUseCase";
import { RecupererTokenAPIInformationUseCase } from "@/server/authentification/usecases/RecupererTokenAPIInformationUseCase";
import { ListerTokenAPIInformationUseCase } from "@/server/authentification/usecases/ListerTokenAPIInformationUseCase";
import { RécupérerMessageInformationUseCase } from "@/server/gestion-contenu/usecases/RécupérerMessageInformationUseCase";
import { ModifierMessageInformationUseCase } from "@/server/gestion-contenu/usecases/ModifierMessageInformationUseCase";
import { SupprimerTokenAPIUseCase } from "@/server/authentification/usecases/SupprimerTokenAPIUseCase";
import { UtilisateurAuthentifieJWTService } from "@/server/authentification/infrastructure/adapters/services/UtilisateurAuthentifieJWTService";
import { CreerTokenAPIUseCase } from "@/server/authentification/usecases/CreerTokenAPIUseCase";
import { ListerDonneesIndicateurParIndicIdUseCase } from "@/server/chantiers/usecases/ListerDonneesIndicateurParIndicIdUseCase";
import { RécupérerTerritoireParCodeUseCase } from "@/server/fiche-territoriale/usecases/RécupérerTerritoireParCodeUseCase";
import { RécupérerTauxAvancementTerritoireUseCase } from "@/server/fiche-territoriale/usecases/RécupérerTauxAvancementTerritoireUseCase";
import { RécupérerRépartitionMétéoUseCase } from "@/server/fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase";
import { RécupérerListeChantierFicheTerritorialeUseCase } from "@/server/fiche-territoriale/usecases/RécupérerListeChantierFicheTerritorialeUseCase";
import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";

export type LegacyExport = {
  agregerAvancementsChantiersUseCase: AgregerAvancementsChantiersUseCase;
};

type LegacyCradle = LegacyExport & {
  chantierRepository: ChantierRepository;
  axeRepository: AxeRepository;
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
  ministèreRepository: MinistèreRepository;
  indicateurRepository: IndicateurRepository;
  commentaireRepository: CommentaireRepository;
  objectifRepository: ObjectifRepository;
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
  utilisateurRepository: UtilisateurRepository;
  authentificationUtilisateurRepository: AuthentificationUtilisateurRepository;
  authentificationProfilRepository: AuthentificationProfilRepository;
  territoireRepository: TerritoireRepository;
  ficheTerritorialeTerritoireRepository: FicheTerritorialeTerritoireRepository;
  ficheTerritorialeChantierRepository: FicheTerritorialeChantierRepository;
  ficheTerritorialeIndicateurRepository: FicheTerritorialeIndicateurRepository;
  ficheTerritorialeSyntheseDesResultatsRepository: FicheTerritorialeSyntheseDesResultatsRepository;
  ficheTerritorialeMinistereRepository: FicheTerritorialeMinistereRepository;
  chantierIndicateurRepository: ChantierIndicateurRepository;
  profilRepository: ProfilRepository;
  rapportRepository: RapportRepository;
  importIndicateurRepository: ImportIndicateurRepository;
  gestionContenuRepository: GestionContenuRepository;
  tokenAPIService: TokenAPIService;
  tokenAPIInformationRepository: TokenAPIInformationRepository;
  récupérerStatistiquesAvancementChantiersUseCase: RécupérerStatistiquesAvancementChantiersUseCase;
  recupererRepartitionsMeteoChantiersUseCase: RecupererRepartitionsMeteoChantiersUseCase;
  récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase;
  récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase;
  récupérerUnUtilisateurUseCase: RécupérerUnUtilisateurUseCase;
  récupérerUnProfilUseCase: RécupérerUnProfilUseCase;
  récupérerTerritoiresAvecNombreUtilisateursUseCase: RécupérerTerritoiresAvecNombreUtilisateursUseCase;
  recupererTokenAPIInformationUseCase: RecupererTokenAPIInformationUseCase;
  listerTokenAPIInformationUseCase: ListerTokenAPIInformationUseCase;
  récupérerMessageInformationUseCase: RécupérerMessageInformationUseCase;
  modifierMessageInformationUseCase: ModifierMessageInformationUseCase;
  supprimerTokenAPIUseCase: SupprimerTokenAPIUseCase;
  utilisateurAuthentifieJWTService: UtilisateurAuthentifieJWTService;
  creerTokenAPIUseCase: CreerTokenAPIUseCase;
  listerDonneesIndicateurParIndicIdUseCase: ListerDonneesIndicateurParIndicIdUseCase;
  récupérerTerritoireParCodeUseCase: RécupérerTerritoireParCodeUseCase;
  récupérerTauxAvancementTerritoireUseCase: RécupérerTauxAvancementTerritoireUseCase;
  récupérerRépartitionMétéoUseCase: RécupérerRépartitionMétéoUseCase;
  récupérerListeChantierFicheTerritorialeUseCase: RécupérerListeChantierFicheTerritorialeUseCase;
};

export const legacyModule = defineModule<LegacyExport, LegacyCradle>()({
  name: "legacy",
  imports: ["shared"],
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
      authentificationUtilisateurRepository: asModuleClass(
        PrismaUtilisateurRepository,
      ).scoped(),
      authentificationProfilRepository: asModuleClass(
        PrismaProfilRepository,
      ).scoped(),
      territoireRepository: asModuleClass(TerritoireSQLRepository).scoped(),
      ficheTerritorialeTerritoireRepository: asModuleClass(
        PrismaTerritoireRepository,
      ).scoped(),
      ficheTerritorialeChantierRepository: asModuleClass(
        PrismaChantierRepository,
      ).scoped(),
      ficheTerritorialeIndicateurRepository: asModuleClass(
        PrismaFicheTerritorialeIndicateurRepository,
      ).scoped(),
      ficheTerritorialeSyntheseDesResultatsRepository: asModuleClass(
        PrismaSyntheseDesResultatsRepository,
      ).scoped(),
      ficheTerritorialeMinistereRepository: asModuleClass(
        PrismaMinistereRepository,
      ).scoped(),
      chantierIndicateurRepository: asModuleClass(
        PrismaChantierIndicateurRepository,
      ).scoped(),
      profilRepository: asModuleClass(ProfilSQLRepository).scoped(),
      rapportRepository: asModuleClass(PrismaRapportRepository).scoped(),
      importIndicateurRepository: asModuleClass(
        PrismaIndicateurRepository,
      ).scoped(),
      gestionContenuRepository: asModuleClass(
        PrismaGestionContenuRepository,
      ).scoped(),
      tokenAPIService: asModuleFunction(
        () =>
          new TokenAPIJWTService({ secret: configuration().tokenAPI.secret }),
      ).scoped(),
      tokenAPIInformationRepository: asModuleClass(
        PrismaTokenAPIInformationRepository,
      ).scoped(),
      récupérerStatistiquesAvancementChantiersUseCase: asModuleClass(
        RécupérerStatistiquesAvancementChantiersUseCase,
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
      recupererTokenAPIInformationUseCase: asModuleClass(
        RecupererTokenAPIInformationUseCase,
      ).scoped(),
      listerTokenAPIInformationUseCase: asModuleClass(
        ListerTokenAPIInformationUseCase,
      ).scoped(),
      récupérerMessageInformationUseCase: asModuleClass(
        RécupérerMessageInformationUseCase,
      ).scoped(),
      modifierMessageInformationUseCase: asModuleClass(
        ModifierMessageInformationUseCase,
      ).scoped(),
      supprimerTokenAPIUseCase: asModuleClass(
        SupprimerTokenAPIUseCase,
      ).scoped(),
      utilisateurAuthentifieJWTService: asModuleFunction(
        ({
          utilisateurRepository,
          tokenAPIInformationRepository,
          authentificationProfilRepository,
        }) =>
          new UtilisateurAuthentifieJWTService({
            utilisateurRepository,
            tokenAPIRepository: tokenAPIInformationRepository,
            profilRepository: authentificationProfilRepository,
          }),
      ).scoped(),
      creerTokenAPIUseCase: asModuleFunction(
        ({
          tokenAPIService,
          tokenAPIInformationRepository,
          authentificationUtilisateurRepository,
        }) =>
          new CreerTokenAPIUseCase({
            tokenAPIService,
            tokenAPIInformationRepository,
            utilisateurRepository: authentificationUtilisateurRepository,
          }),
      ).scoped(),
      listerDonneesIndicateurParIndicIdUseCase: asModuleFunction(
        ({ chantierIndicateurRepository }) =>
          new ListerDonneesIndicateurParIndicIdUseCase({
            indicateurRepository: chantierIndicateurRepository,
          }),
      ).scoped(),
      récupérerTerritoireParCodeUseCase: asModuleFunction(
        ({ ficheTerritorialeTerritoireRepository }) =>
          new RécupérerTerritoireParCodeUseCase({
            territoireRepository: ficheTerritorialeTerritoireRepository,
          }),
      ).scoped(),
      récupérerTauxAvancementTerritoireUseCase: asModuleFunction(
        ({
          ficheTerritorialeChantierRepository,
          ficheTerritorialeTerritoireRepository,
        }) =>
          new RécupérerTauxAvancementTerritoireUseCase({
            chantierRepository: ficheTerritorialeChantierRepository,
            territoireRepository: ficheTerritorialeTerritoireRepository,
          }),
      ).scoped(),
      récupérerRépartitionMétéoUseCase: asModuleFunction(
        ({
          ficheTerritorialeChantierRepository,
          ficheTerritorialeTerritoireRepository,
        }) =>
          new RécupérerRépartitionMétéoUseCase({
            chantierRepository: ficheTerritorialeChantierRepository,
            territoireRepository: ficheTerritorialeTerritoireRepository,
          }),
      ).scoped(),
      récupérerListeChantierFicheTerritorialeUseCase: asModuleFunction(
        ({
          ficheTerritorialeChantierRepository,
          ficheTerritorialeTerritoireRepository,
          ficheTerritorialeSyntheseDesResultatsRepository,
          ficheTerritorialeIndicateurRepository,
          ficheTerritorialeMinistereRepository,
        }) =>
          new RécupérerListeChantierFicheTerritorialeUseCase({
            chantierRepository: ficheTerritorialeChantierRepository,
            territoireRepository: ficheTerritorialeTerritoireRepository,
            syntheseDesResultatsRepository:
              ficheTerritorialeSyntheseDesResultatsRepository,
            indicateurRepository: ficheTerritorialeIndicateurRepository,
            ministereRepository: ficheTerritorialeMinistereRepository,
          }),
      ).scoped(),
    } satisfies VerifyCradle<LegacyCradle>);
  },
});

type Scope = ExtractScope<typeof legacyModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;

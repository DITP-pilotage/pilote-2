import { asClass, asFunction, AwilixContainer } from "awilix";
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
import { InitialDependencies } from "@/server/InitialDependencies";
import RécupérerStatistiquesAvancementChantiersUseCase from "@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase";
import { RecupererRepartitionsMeteoChantiersUseCase } from "@/server/chantiers/usecases/RecupererRepartitionMeteoChantiersUseCase";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import CréerUnCommentaireUseCase from "@/server/usecase/chantier/commentaire/CréerUnCommentaireUseCase";
import RécupérerCommentaireLePlusRécentUseCase from "@/server/usecase/chantier/commentaire/RécupérerCommentaireLePlusRécentUseCase";
import RécupérerHistoriqueCommentaireUseCase from "@/server/usecase/chantier/commentaire/RécupérerHistoriqueCommentaireUseCase";
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase";
import CréerUnObjectifUseCase from "@/server/usecase/chantier/objectif/CréerUnObjectifUseCase";
import RécupérerObjectifLePlusRécentUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifLePlusRécentUseCase";
import RécupérerHistoriqueObjectifUseCase from "@/server/usecase/chantier/objectif/RécupérerHistoriqueObjectifUseCase";
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase";
import CréerUneDécisionStratégiqueUseCase from "@/server/usecase/chantier/décision/CréerUneDécisionStratégiqueUseCase";
import RécupérerDécisionStratégiqueLaPlusRécenteUseCase from "@/server/usecase/chantier/décision/RécupérerDécisionStratégiqueLaPlusRécenteUseCase";
import RécupérerHistoriqueDécisionStratégiqueUseCase from "@/server/usecase/chantier/décision/RécupérerHistoriqueDécisionStratégiqueUseCase";
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

export type LegacyDependencies = {
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
  agregerAvancementsChantiersUseCase: AgregerAvancementsChantiersUseCase;
  créerUnCommentaireUseCase: CréerUnCommentaireUseCase;
  récupérerCommentaireLePlusRécentUseCase: RécupérerCommentaireLePlusRécentUseCase;
  récupérerHistoriqueCommentaireUseCase: RécupérerHistoriqueCommentaireUseCase;
  récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase;
  créerUnObjectifUseCase: CréerUnObjectifUseCase;
  récupérerObjectifLePlusRécentUseCase: RécupérerObjectifLePlusRécentUseCase;
  récupérerHistoriqueObjectifUseCase: RécupérerHistoriqueObjectifUseCase;
  récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase;
  créerUneDécisionStratégiqueUseCase: CréerUneDécisionStratégiqueUseCase;
  récupérerDécisionStratégiqueLaPlusRécenteUseCase: RécupérerDécisionStratégiqueLaPlusRécenteUseCase;
  récupérerHistoriqueDécisionStratégiqueUseCase: RécupérerHistoriqueDécisionStratégiqueUseCase;
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

export const getLegacyContainer = (
  initialContainer: AwilixContainer<InitialDependencies>,
): AwilixContainer<LegacyDependencies> => {
  return initialContainer.createScope<LegacyDependencies>().register({
    chantierRepository: asClass(ChantierSQLRepository).singleton(),
    axeRepository: asClass(AxeSQLRepository).singleton(),
    synthèseDesRésultatsRepository: asClass(
      SynthèseDesRésultatsSQLRepository,
    ).singleton(),
    ministèreRepository: asClass(MinistèreSQLRepository).singleton(),
    indicateurRepository: asClass(IndicateurSQLRepository).singleton(),
    commentaireRepository: asClass(CommentaireSQLRepository).singleton(),
    objectifRepository: asClass(ObjectifSQLRepository).singleton(),
    décisionStratégiqueRepository: asClass(
      DécisionStratégiqueSQLRepository,
    ).singleton(),
    utilisateurRepository: asClass(UtilisateurSQLRepository).singleton(),
    authentificationUtilisateurRepository: asClass(
      PrismaUtilisateurRepository,
    ).singleton(),
    authentificationProfilRepository: asClass(
      PrismaProfilRepository,
    ).singleton(),
    territoireRepository: asClass(TerritoireSQLRepository).singleton(),
    ficheTerritorialeTerritoireRepository: asClass(
      PrismaTerritoireRepository,
    ).singleton(),
    ficheTerritorialeChantierRepository: asClass(
      PrismaChantierRepository,
    ).singleton(),
    ficheTerritorialeIndicateurRepository: asClass(
      PrismaFicheTerritorialeIndicateurRepository,
    ).singleton(),
    ficheTerritorialeSyntheseDesResultatsRepository: asClass(
      PrismaSyntheseDesResultatsRepository,
    ).singleton(),
    ficheTerritorialeMinistereRepository: asClass(
      PrismaMinistereRepository,
    ).singleton(),
    chantierIndicateurRepository: asClass(
      PrismaChantierIndicateurRepository,
    ).singleton(),
    profilRepository: asClass(ProfilSQLRepository).singleton(),
    rapportRepository: asClass(PrismaRapportRepository).singleton(),
    importIndicateurRepository: asClass(PrismaIndicateurRepository).singleton(),
    gestionContenuRepository: asClass(
      PrismaGestionContenuRepository,
    ).singleton(),
    tokenAPIService: asFunction(
      () => new TokenAPIJWTService({ secret: configuration().tokenAPI.secret }),
    ).singleton(),
    tokenAPIInformationRepository: asClass(
      PrismaTokenAPIInformationRepository,
    ).singleton(),
    récupérerStatistiquesAvancementChantiersUseCase: asClass(
      RécupérerStatistiquesAvancementChantiersUseCase,
    ).singleton(),
    recupererRepartitionsMeteoChantiersUseCase: asClass(
      RecupererRepartitionsMeteoChantiersUseCase,
    ).singleton(),
    agregerAvancementsChantiersUseCase: asClass(
      AgregerAvancementsChantiersUseCase,
    ).singleton(),
    créerUnCommentaireUseCase: asClass(CréerUnCommentaireUseCase).singleton(),
    récupérerCommentaireLePlusRécentUseCase: asClass(
      RécupérerCommentaireLePlusRécentUseCase,
    ).singleton(),
    récupérerHistoriqueCommentaireUseCase: asClass(
      RécupérerHistoriqueCommentaireUseCase,
    ).singleton(),
    récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase:
      asClass(
        RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase,
      ).singleton(),
    créerUnObjectifUseCase: asClass(CréerUnObjectifUseCase).singleton(),
    récupérerObjectifLePlusRécentUseCase: asClass(
      RécupérerObjectifLePlusRécentUseCase,
    ).singleton(),
    récupérerHistoriqueObjectifUseCase: asClass(
      RécupérerHistoriqueObjectifUseCase,
    ).singleton(),
    récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase: asClass(
      RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase,
    ).singleton(),
    créerUneDécisionStratégiqueUseCase: asClass(
      CréerUneDécisionStratégiqueUseCase,
    ).singleton(),
    récupérerDécisionStratégiqueLaPlusRécenteUseCase: asClass(
      RécupérerDécisionStratégiqueLaPlusRécenteUseCase,
    ).singleton(),
    récupérerHistoriqueDécisionStratégiqueUseCase: asClass(
      RécupérerHistoriqueDécisionStratégiqueUseCase,
    ).singleton(),
    récupérerUnUtilisateurUseCase: asClass(
      RécupérerUnUtilisateurUseCase,
    ).singleton(),
    récupérerUnProfilUseCase: asClass(RécupérerUnProfilUseCase).singleton(),
    récupérerTerritoiresAvecNombreUtilisateursUseCase: asClass(
      RécupérerTerritoiresAvecNombreUtilisateursUseCase,
    ).singleton(),
    recupererTokenAPIInformationUseCase: asClass(
      RecupererTokenAPIInformationUseCase,
    ).singleton(),
    listerTokenAPIInformationUseCase: asClass(
      ListerTokenAPIInformationUseCase,
    ).singleton(),
    récupérerMessageInformationUseCase: asClass(
      RécupérerMessageInformationUseCase,
    ).singleton(),
    modifierMessageInformationUseCase: asClass(
      ModifierMessageInformationUseCase,
    ).singleton(),
    supprimerTokenAPIUseCase: asClass(SupprimerTokenAPIUseCase).singleton(),
    utilisateurAuthentifieJWTService: asFunction(
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
    ).singleton(),
    creerTokenAPIUseCase: asFunction(
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
    ).singleton(),
    listerDonneesIndicateurParIndicIdUseCase: asFunction(
      ({ chantierIndicateurRepository }) =>
        new ListerDonneesIndicateurParIndicIdUseCase({
          indicateurRepository: chantierIndicateurRepository,
        }),
    ).singleton(),
    récupérerTerritoireParCodeUseCase: asFunction(
      ({ ficheTerritorialeTerritoireRepository }) =>
        new RécupérerTerritoireParCodeUseCase({
          territoireRepository: ficheTerritorialeTerritoireRepository,
        }),
    ).singleton(),
    récupérerTauxAvancementTerritoireUseCase: asFunction(
      ({
        ficheTerritorialeChantierRepository,
        ficheTerritorialeTerritoireRepository,
      }) =>
        new RécupérerTauxAvancementTerritoireUseCase({
          chantierRepository: ficheTerritorialeChantierRepository,
          territoireRepository: ficheTerritorialeTerritoireRepository,
        }),
    ).singleton(),
    récupérerRépartitionMétéoUseCase: asFunction(
      ({
        ficheTerritorialeChantierRepository,
        ficheTerritorialeTerritoireRepository,
      }) =>
        new RécupérerRépartitionMétéoUseCase({
          chantierRepository: ficheTerritorialeChantierRepository,
          territoireRepository: ficheTerritorialeTerritoireRepository,
        }),
    ).singleton(),
    récupérerListeChantierFicheTerritorialeUseCase: asFunction(
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
    ).singleton(),
  });
};

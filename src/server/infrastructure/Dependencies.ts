import ChantierSQLRepository from '@/server/infrastructure/accès_données/chantier/ChantierSQLRepository';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import IndicateurSQLRepository from '@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository';
import MinistèreSQLRepository from '@/server/infrastructure/accès_données/ministère/MinistèreSQLRepository';
import SynthèseDesRésultatsRepository
  from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import {
  SynthèseDesRésultatsSQLRepository,
} from '@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import AxeRepository from '@/server/domain/axe/AxeRepository.interface';
import AxeSQLRepository from '@/server/infrastructure/accès_données/axe/AxeSQLRepository';
import CommentaireRepository from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository
  from '@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository';
import ObjectifRepository from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import DécisionStratégiqueRepository
  from '@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import {
  UtilisateurRepository as AuthentificationUtilisateurRepository,
} from '@/server/authentification/domain/ports/UtilisateurRepository';
import {
  ProfilRepository as AuthentificationProfilRepository,
} from '@/server/authentification/domain/ports/ProfilRepository';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import {
  TerritoireRepository as FicheTerritorialeTerritoireRepository,
} from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import {
  ChantierRepository as FicheTerritorialeChantierRepository,
} from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import {
  IndicateurRepository as FicheTerritorialeIndicateurRepository,
} from '@/server/fiche-territoriale/domain/ports/IndicateurRepository';
import {
  SyntheseDesResultatsRepository as FicheTerritorialeSyntheseDesResultatsRepository,
} from '@/server/fiche-territoriale/domain/ports/SyntheseDesResultatsRepository';
import {
  MinistereRepository as FicheTerritorialeMinistereRepository,
} from '@/server/fiche-territoriale/domain/ports/MinistereRepository';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';
import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import PérimètreMinistérielRepository
  from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import ObjectifSQLRepository from '@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository';
import DécisionStratégiqueSQLRepository
  from '@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository';
import ProfilSQLRepository from '@/server/infrastructure/accès_données/profil/ProfilSQLRepository';
import ProfilRepository from '@/server/domain/profil/ProfilRepository';
import {
  PrismaIndicateurRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaIndicateurRepository';
import {
  IndicateurRepository as ImportIndicateurRepository,
} from '@/server/import-indicateur/domain/ports/IndicateurRepository';
import {
  IndicateurRepository as ChantierIndicateurRepository,
} from '@/server/chantiers/domain/ports/IndicateurRepository';
import {
  PrismaHistorisationModificationRepository,
} from '@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import { GestionContenuRepository } from '@/server/gestion-contenu/domain/ports/GestionContenuRepository';
import {
  PrismaGestionContenuRepository,
} from '@/server/gestion-contenu/infrastructure/adapters/PrismaGestionContenuRepository';
import {
  PrismaTerritoireRepository,
} from '@/server/fiche-territoriale/infrastructure/adapters/PrismaTerritoireRepository';
import { PrismaChantierRepository } from '@/server/fiche-territoriale/infrastructure/adapters/PrismaChantierRepository';
import {
  PrismaSyntheseDesResultatsRepository,
} from '@/server/fiche-territoriale/infrastructure/adapters/PrismaSyntheseDesResultatsRepository';
import {
  PrismaIndicateurRepository as PrismaFicheTerritorialeIndicateurRepository,
} from '@/server/fiche-territoriale/infrastructure/adapters/PrismaIndicateurRepository';
import {
  PrismaMinistereRepository,
} from '@/server/fiche-territoriale/infrastructure/adapters/PrismaMinistereRepository';
import {
  PrismaIndicateurRepository as PrismaChantierIndicateurRepository,
} from '@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { TokenAPIService } from '@/server/authentification/domain/ports/TokenAPIService';
import { TokenAPIJWTService } from '@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService';
import { configuration } from '@/config';
import {
  PrismaTokenAPIInformationRepository,
} from '@/server/authentification/infrastructure/adapters/PrismaTokenAPIInformationRepository';
import {
  PrismaUtilisateurRepository,
} from '@/server/authentification/infrastructure/adapters/PrismaUtilisateurRepository';
import { PrismaProfilRepository } from '@/server/authentification/infrastructure/adapters/PrismaProfilRepository';
import {
  PropositionValeurActuelleRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import {
  PrismaPropositionValeurActuelleRepository,
} from '@/server/chantiers/infrastructure/adapters/PrismaPropositionValeurActuelleRepository';
import { UtilisateurSQLRepository } from './accès_données/utilisateur/UtilisateurSQLRepository';
import { TerritoireSQLRepository } from './accès_données/territoire/TerritoireSQLRepository';
import PérimètreMinistérielSQLRepository from './accès_données/périmètreMinistériel/PérimètreMinistérielSQLRepository';

class Dependencies {
  private readonly _chantierRepository: ChantierRepository;

  private readonly _axeRepository: AxeRepository;

  private readonly _synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;

  private readonly _ministèreRepository: MinistèreRepository;

  private readonly _indicateurRepository: IndicateurRepository;

  private readonly _commentaireRepository: CommentaireRepository;

  private readonly _objectifRepository: ObjectifRepository;

  private readonly _décisionStratégiqueRepository: DécisionStratégiqueRepository;

  private readonly _utilisateurRepository: UtilisateurRepository;

  private readonly _authentificationUtilisateurRepository: AuthentificationUtilisateurRepository;

  private readonly _authentificationProfilRepository: AuthentificationProfilRepository;

  private readonly _territoireRepository: TerritoireRepository;

  private readonly _ficheTerritorialeTerritoireRepository: FicheTerritorialeTerritoireRepository;

  private readonly _ficheTerritorialeChantierRepository: FicheTerritorialeChantierRepository;

  private readonly _ficheTerritorialeIndicateurRepository: FicheTerritorialeIndicateurRepository;

  private readonly _ficheTerritorialeSyntheseDesResultatsRepository: FicheTerritorialeSyntheseDesResultatsRepository;

  private readonly _ficheTerritorialeMinistereRepository: FicheTerritorialeMinistereRepository;

  private readonly _chantierIndicateurRepository: ChantierIndicateurRepository;

  private readonly _profilRepository: ProfilRepository;

  private readonly _rapportRepository: RapportRepository;

  private readonly _périmètreMinistérielRepository: PérimètreMinistérielRepository;

  private readonly _importIndicateurRepository: ImportIndicateurRepository;

  private readonly _historisationModification: HistorisationModificationRepository;

  private readonly _gestionContenuRepository: GestionContenuRepository;

  private readonly _tokenAPIService: TokenAPIService;

  private readonly _tokenAPIInformationRepository: TokenAPIInformationRepository;

  private readonly _propositionValeurActuelleRepository: PropositionValeurActuelleRepository;

  constructor() {
    this._chantierRepository = new ChantierSQLRepository();
    this._axeRepository = new AxeSQLRepository();
    this._ministèreRepository = new MinistèreSQLRepository();
    this._indicateurRepository = new IndicateurSQLRepository();
    this._synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository();
    this._commentaireRepository = new CommentaireSQLRepository();
    this._objectifRepository = new ObjectifSQLRepository();
    this._décisionStratégiqueRepository = new DécisionStratégiqueSQLRepository();
    this._utilisateurRepository = new UtilisateurSQLRepository();
    this._authentificationUtilisateurRepository = new PrismaUtilisateurRepository();
    this._authentificationProfilRepository = new PrismaProfilRepository();
    this._territoireRepository = new TerritoireSQLRepository();
    this._ficheTerritorialeTerritoireRepository = new PrismaTerritoireRepository();
    this._ficheTerritorialeChantierRepository = new PrismaChantierRepository();
    this._ficheTerritorialeIndicateurRepository = new PrismaFicheTerritorialeIndicateurRepository();
    this._ficheTerritorialeSyntheseDesResultatsRepository = new PrismaSyntheseDesResultatsRepository();
    this._ficheTerritorialeMinistereRepository = new PrismaMinistereRepository();
    this._chantierIndicateurRepository = new PrismaChantierIndicateurRepository();
    this._profilRepository = new ProfilSQLRepository();
    this._rapportRepository = new PrismaRapportRepository();
    this._périmètreMinistérielRepository = new PérimètreMinistérielSQLRepository();
    this._importIndicateurRepository = new PrismaIndicateurRepository();
    this._historisationModification = new PrismaHistorisationModificationRepository();
    this._gestionContenuRepository = new PrismaGestionContenuRepository();
    this._tokenAPIService = new TokenAPIJWTService({ secret: configuration.tokenAPI.secret });
    this._tokenAPIInformationRepository = new PrismaTokenAPIInformationRepository();
    this._propositionValeurActuelleRepository = new PrismaPropositionValeurActuelleRepository();
  }

  getGestionContenuRepository(): GestionContenuRepository {
    return this._gestionContenuRepository;
  }

  getHistorisationModificationRepository(): HistorisationModificationRepository {
    return this._historisationModification;
  }

  getChantierRepository(): ChantierRepository {
    return this._chantierRepository;
  }

  getAxeRepository(): AxeRepository {
    return this._axeRepository;
  }

  getSynthèseDesRésultatsRepository(): SynthèseDesRésultatsRepository {
    return this._synthèseDesRésultatsRepository;
  }

  getCommentaireRepository(): CommentaireRepository {
    return this._commentaireRepository;
  }

  getObjectifRepository(): ObjectifRepository {
    return this._objectifRepository;
  }

  getDécisionStratégiqueRepository(): DécisionStratégiqueRepository {
    return this._décisionStratégiqueRepository;
  }

  getMinistèreRepository(): MinistèreRepository {
    return this._ministèreRepository;
  }

  getIndicateurRepository(): IndicateurRepository {
    return this._indicateurRepository;
  }

  getImportIndicateurRepository(): ImportIndicateurRepository {
    return this._importIndicateurRepository;
  }

  getRapportRepository(): RapportRepository {
    return this._rapportRepository;
  }

  getUtilisateurRepository() {
    return this._utilisateurRepository;
  }

  getAuthentificationUtilisateurRepository() {
    return this._authentificationUtilisateurRepository;
  }

  getAuthentificationProfilRepository() {
    return this._authentificationProfilRepository;
  }

  getTerritoireRepository() {
    return this._territoireRepository;
  }

  getFicheTerritorialeTerritoireRepository() {
    return this._ficheTerritorialeTerritoireRepository;
  }

  getFicheTerritorialeChantierRepository() {
    return this._ficheTerritorialeChantierRepository;
  }

  getFicheTerritorialeIndicateurRepository() {
    return this._ficheTerritorialeIndicateurRepository;
  }

  getFicheTerritorialeSyntheseDesResultatsRepository() {
    return this._ficheTerritorialeSyntheseDesResultatsRepository;
  }

  getFicheTerritorialeMinistereRepository() {
    return this._ficheTerritorialeMinistereRepository;
  }

  getChantierIndicateurRepository() {
    return this._chantierIndicateurRepository;
  }

  getProfilRepository() {
    return this._profilRepository;
  }

  getPérimètreMinistérielRepository() {
    return this._périmètreMinistérielRepository;
  }

  getTokenAPIService() {
    return this._tokenAPIService;
  }

  getTokenAPIInformationRepository() {
    return this._tokenAPIInformationRepository;
  }

  getPropositionValeurActuelleRepository() {
    return this._propositionValeurActuelleRepository;
  }
}

export const dependencies = new Dependencies();

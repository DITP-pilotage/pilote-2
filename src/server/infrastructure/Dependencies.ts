import { MinistereRepository } from '@/server/chantiers/domain/ports/MinistereRepository';
import { IndicateurRepository } from '@/server/domain/indicateur/IndicateurRepository.interface';
import IndicateurSQLRepository from '@/server/infrastructure/accès_données/chantier/indicateur/PrismaIndicateurRepository';
import MinistèreSQLRepository from '@/server/infrastructure/accès_données/ministere/PrismaMinistereRepository';
import { SyntheseDesResultatsRepository }
  from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import {
  SynthèseDesRésultatsSQLRepository,
} from '@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/PrismaSyntheseDesResultatsRepository';
import { CommentaireRepository } from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository
  from '@/server/infrastructure/accès_données/chantier/commentaire/PrismaCommentaireRepository';
import { ObjectifRepository } from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import {DecisionStrategiqueRepository}
  from '@/server/chantiers/domain/ports/DecisionStrategiqueRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import {
  UtilisateurRepository as AuthentificationUtilisateurRepository,
} from '@/server/authentification/domain/ports/UtilisateurRepository';
import {
  ProfilRepository as AuthentificationProfilRepository,
} from '@/server/authentification/domain/ports/ProfilRepository';
import { TerritoireRepository } from '@/server/domain/territoire/TerritoireRepository.interface';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';
import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import { PerimetreMinisterielRepository }
  from '@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository.interface';
import ObjectifSQLRepository from '@/server/infrastructure/accès_données/chantier/objectif/PrismaObjectifRepository';
import DécisionStratégiqueSQLRepository
  from '@/server/infrastructure/accès_données/chantier/decisionStratégique/PrismaDecisionStrategiqueRepository';
import ProfilSQLRepository from '@/server/infrastructure/accès_données/profil/PrismaProfilRepository';
import { ProfilRepository } from '@/server/domain/profil/ProfilRepository';
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
import { TerritoireSQLRepository } from '@/server/chantiers/infrastructure/adapters/PrismaTerritoireRepository';
import { UtilisateurSQLRepository } from './accès_données/utilisateur/PrismaUtilisateurRepository';
import PérimètreMinistérielSQLRepository from './accès_données/perimètreMinistériel/PrismaPerimetreMinisterielRepository';
import ChantierSQLRepository from '@/server/infrastructure/accès_données/chantier/PrismaChantierRepository';

class Dependencies {
  private readonly _synthèseDesRésultatsRepository: SyntheseDesResultatsRepository;

  private readonly _ministèreRepository: MinistereRepository;

  private readonly _indicateurRepository: IndicateurRepository;

  private readonly _commentaireRepository: CommentaireRepository;

  private readonly _objectifRepository: ObjectifRepository;

  private readonly _décisionStratégiqueRepository: DecisionStrategiqueRepository;

  private readonly _utilisateurRepository: UtilisateurRepository;

  private readonly _authentificationUtilisateurRepository: AuthentificationUtilisateurRepository;

  private readonly _authentificationProfilRepository: AuthentificationProfilRepository;

  private readonly _territoireRepository: TerritoireRepository;

  private readonly _chantierIndicateurRepository: ChantierIndicateurRepository;

  private readonly _profilRepository: ProfilRepository;

  private readonly _rapportRepository: RapportRepository;

  private readonly _périmètreMinistérielRepository: PerimetreMinisterielRepository;

  private readonly _importIndicateurRepository: ImportIndicateurRepository;

  private readonly _historisationModification: HistorisationModificationRepository;

  private readonly _gestionContenuRepository: GestionContenuRepository;

  private readonly _tokenAPIService: TokenAPIService;

  private readonly _tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor() {
    this._chantierRepository = new ChantierSQLRepository();
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
    this._chantierIndicateurRepository = new PrismaChantierIndicateurRepository();
    this._profilRepository = new ProfilSQLRepository();
    this._rapportRepository = new PrismaRapportRepository();
    this._périmètreMinistérielRepository = new PérimètreMinistérielSQLRepository();
    this._importIndicateurRepository = new PrismaIndicateurRepository();
    this._historisationModification = new PrismaHistorisationModificationRepository();
    this._gestionContenuRepository = new PrismaGestionContenuRepository();
    this._tokenAPIService = new TokenAPIJWTService({ secret: configuration.tokenAPI.secret });
    this._tokenAPIInformationRepository = new PrismaTokenAPIInformationRepository();
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
}

export const dependencies = new Dependencies();

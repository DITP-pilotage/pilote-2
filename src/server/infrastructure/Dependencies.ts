import { PrismaClient } from '@prisma/client';
import process from 'node:process';
import assert from 'node:assert/strict';
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
import PpgRepository from '@/server/domain/ppg/PpgRepository.interface';
import PpgSQLRepository from '@/server/infrastructure/accès_données/ppg/PpgSQLRepository';
import CommentaireRepository from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository
  from '@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository';
import ObjectifRepository from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import {
  ValidataFichierIndicateurValidationService,
} from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';
import { FetchHttpClient } from '@/server/import-indicateur/infrastructure/adapters/FetchHttpClient';
import {
  PrismaMesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaMesureIndicateurTemporaireRepository';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurIAMKeycloakRepository
  from '@/server/infrastructure/accès_données/utilisateur/UtilisateurIAMKeycloakRepository';
import DécisionStratégiqueRepository
  from '@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import {
  TerritoireRepository as FicheTerritorialeTerritoireRepository,
} from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';

import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';
import ObjectifProjetStructurantRepository
  from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import {
  VerifierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase';
import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import {
  PrismaMesureIndicateurRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaMesureIndicateurRepository';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import {
  MesureIndicateurRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';
import CommentaireProjetStructurantRepository
  from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import {
  PublierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase';
import PérimètreMinistérielRepository
  from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import {
  SynthèseDesRésultatsProjetStructurantSQLRepository,
} from '@/server/infrastructure/accès_données/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsProjetStructurantSQLRepository';
import SynthèseDesRésultatsProjetStructurantRepository
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import ObjectifSQLRepository from '@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository';
import DécisionStratégiqueSQLRepository
  from '@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository';
import IndicateurProjetStructurantRepository
  from '@/server/domain/indicateur/IndicateurProjetStructurantRepository.interface';
import ProfilSQLRepository from '@/server/infrastructure/accès_données/profil/ProfilSQLRepository';
import ProfilRepository from '@/server/domain/profil/ProfilRepository';
import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDatesDeMàjRepository.interface';
import ChantierDatesDeMàjSQLRepository
  from '@/server/infrastructure/accès_données/chantier/ChantierDatesDeMàjSQLRepository';
import {
  ErreurValidationFichierRepository,
} from '@/server/import-indicateur/domain/ports/ErreurValidationFichierRepository';
import {
  PrismaErreurValidationFichierRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaErreurValidationFichierRepository';
import {
  PrismaIndicateurRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaIndicateurRepository';
import {
  IndicateurRepository as ImportIndicateurRepository,
} from '@/server/import-indicateur/domain/ports/IndicateurRepository';
import {
  PrismaMetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/infrastructure/adapters/PrismaMetadataParametrageIndicateurRepository';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import {
  YamlInformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/infrastructure/adapters/YamlInformationMetadataIndicateurRepository';
import {
  InformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/ports/InformationMetadataIndicateurRepository';
import {
  HistorisationModificationSQLRepository,
} from '@/server/infrastructure/accès_données/historisationModification/HistorisationModificationSQLRepository';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import ImportMasseMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/ImportMasseMetadataIndicateurUseCase';
import { GestionContenuRepository } from '@/server/gestion-contenu/domain/ports/GestionContenuRepository';
import {
  PrismaGestionContenuRepository,
} from '@/server/gestion-contenu/infrastructure/adapters/PrismaGestionContenuRepository';
import {
  PrismaTerritoireRepository,
} from '@/server/fiche-territoriale/infrastructure/adapters/PrismaTerritoireRepository';
import { UtilisateurSQLRepository } from './accès_données/utilisateur/UtilisateurSQLRepository';
import { TerritoireSQLRepository } from './accès_données/territoire/TerritoireSQLRepository';
import ProjetStructurantSQLRepository from './accès_données/projetStructurant/ProjetStructurantSQLRepository';
import ObjectifProjetStructurantSQLRepository
  from './accès_données/projetStructurant/objectif/ObjectifProjetStructurantSQLRepository';
import CommentaireProjetStructurantSQLRepository
  from './accès_données/projetStructurant/commentaire/CommentaireProjetStructurantSQLRepository';
import PérimètreMinistérielSQLRepository from './accès_données/périmètreMinistériel/PérimètreMinistérielSQLRepository';
import IndicateurProjetStructurantSQLRepository
  from './accès_données/projetStructurant/indicateur/IndicateurSQLRepository';

// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

class Dependencies {
  private readonly _chantierRepository: ChantierRepository;

  private readonly _chantierDatesDeMàjRepository: ChantierDatesDeMàjRepository;

  private readonly _axeRepository: AxeRepository;

  private readonly _ppgRepository: PpgRepository;

  private readonly _synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;

  private readonly _ministèreRepository: MinistèreRepository;

  private readonly _indicateurRepository: IndicateurRepository;

  private readonly _commentaireRepository: CommentaireRepository;

  private readonly _objectifRepository: ObjectifRepository;

  private readonly _décisionStratégiqueRepository: DécisionStratégiqueRepository;

  private readonly _publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase;

  private readonly _verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase;

  private readonly _utilisateurRepository: UtilisateurRepository;

  private readonly _territoireRepository: TerritoireRepository;

  private readonly _ficheTerritorialeTerritoireRepository: FicheTerritorialeTerritoireRepository;

  private readonly _projetStructurantRepository: ProjetStructurantRepository;

  private readonly _profilRepository: ProfilRepository;

  private readonly _objectifProjetStructurantRepository: ObjectifProjetStructurantRepository;

  private readonly _rapportRepository: RapportRepository;

  private readonly _mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;

  private readonly _erreurValidationFichierRepository: ErreurValidationFichierRepository;

  private readonly _mesureIndicateurRepository: MesureIndicateurRepository;

  private readonly _commentaireProjetStructurantRepository: CommentaireProjetStructurantRepository;

  private readonly _périmètreMinistérielRepository: PérimètreMinistérielRepository;

  private readonly _synthèseDesRésultatsProjetStructurantRepository: SynthèseDesRésultatsProjetStructurantRepository;

  private readonly _indicateurProjetStructurantRepository: IndicateurProjetStructurantRepository;

  private readonly _importIndicateurRepository: ImportIndicateurRepository;

  private readonly _metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;

  private readonly _informationMetadataIndicateurRepository: InformationMetadataIndicateurRepository;

  private _utilisateurIAMRepository: UtilisateurIAMRepository | undefined;

  private readonly _historisationModification: HistorisationModificationRepository;

  private readonly _gestionContenuRepository: GestionContenuRepository;

  private readonly _importMasseMetadataIndicateurUseCase: ImportMasseMetadataIndicateurUseCase;

  constructor() {
    const prisma = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma;
    }

    this._chantierRepository = new ChantierSQLRepository(prisma);
    this._chantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);
    this._axeRepository = new AxeSQLRepository(prisma);
    this._ppgRepository = new PpgSQLRepository(prisma);
    this._ministèreRepository = new MinistèreSQLRepository(prisma);
    this._indicateurRepository = new IndicateurSQLRepository(prisma);
    this._synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
    this._commentaireRepository = new CommentaireSQLRepository(prisma);
    this._objectifRepository = new ObjectifSQLRepository(prisma);
    this._décisionStratégiqueRepository = new DécisionStratégiqueSQLRepository(prisma);
    this._utilisateurRepository = new UtilisateurSQLRepository(prisma);
    this._territoireRepository = new TerritoireSQLRepository(prisma);
    this._ficheTerritorialeTerritoireRepository = new PrismaTerritoireRepository(prisma);
    this._projetStructurantRepository = new ProjetStructurantSQLRepository(prisma);
    this._profilRepository = new ProfilSQLRepository(prisma);
    this._objectifProjetStructurantRepository = new ObjectifProjetStructurantSQLRepository(prisma);
    this._rapportRepository = new PrismaRapportRepository(prisma);
    this._mesureIndicateurTemporaireRepository = new PrismaMesureIndicateurTemporaireRepository(prisma);
    this._erreurValidationFichierRepository = new PrismaErreurValidationFichierRepository(prisma);
    this._mesureIndicateurRepository = new PrismaMesureIndicateurRepository(prisma);
    this._commentaireProjetStructurantRepository = new CommentaireProjetStructurantSQLRepository(prisma);
    this._périmètreMinistérielRepository = new PérimètreMinistérielSQLRepository(prisma);
    this._synthèseDesRésultatsProjetStructurantRepository = new SynthèseDesRésultatsProjetStructurantSQLRepository(prisma);
    this._indicateurProjetStructurantRepository = new IndicateurProjetStructurantSQLRepository(prisma);
    this._importIndicateurRepository = new PrismaIndicateurRepository(prisma);
    this._metadataParametrageIndicateurRepository = new PrismaMetadataParametrageIndicateurRepository(prisma);
    this._informationMetadataIndicateurRepository = new YamlInformationMetadataIndicateurRepository();
    this._historisationModification = new HistorisationModificationSQLRepository(prisma);
    this._gestionContenuRepository = new PrismaGestionContenuRepository(prisma);

    const httpClient = new FetchHttpClient();
    const fichierIndicateurValidationService = new ValidataFichierIndicateurValidationService({ httpClient });

    this._publierFichierIndicateurImporteUseCase = new PublierFichierIndicateurImporteUseCase({
      mesureIndicateurRepository: this._mesureIndicateurRepository,
      mesureIndicateurTemporaireRepository: this._mesureIndicateurTemporaireRepository,
      rapportRepository: this._rapportRepository,
    });

    this._verifierFichierIndicateurImporteUseCase = new VerifierFichierIndicateurImporteUseCase({
      fichierIndicateurValidationService,
      rapportRepository: this._rapportRepository,
      mesureIndicateurTemporaireRepository: this._mesureIndicateurTemporaireRepository,
      indicateurRepository: this._importIndicateurRepository,
      erreurValidationFichierRepository: this._erreurValidationFichierRepository,
    });

    this._importMasseMetadataIndicateurUseCase = new ImportMasseMetadataIndicateurUseCase({
      metadataParametrageIndicateurRepository: this._metadataParametrageIndicateurRepository,
    });
  }


  getImportMasseMetadataIndicateurUseCase(): ImportMasseMetadataIndicateurUseCase {
    return this._importMasseMetadataIndicateurUseCase;
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

  getChantierDatesDeMàjRepository(): ChantierDatesDeMàjRepository {
    return this._chantierDatesDeMàjRepository;
  }

  getAxeRepository(): AxeRepository {
    return this._axeRepository;
  }

  getPpgRepository(): PpgRepository {
    return this._ppgRepository;
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

  getMetadataParametrageIndicateurRepository(): MetadataParametrageIndicateurRepository {
    return this._metadataParametrageIndicateurRepository;
  }

  getRapportRepository(): RapportRepository {
    return this._rapportRepository;
  }

  getMesureIndicateurTemporaireRepository(): MesureIndicateurTemporaireRepository {
    return this._mesureIndicateurTemporaireRepository;
  }

  getMesureIndicateurRepository(): MesureIndicateurRepository {
    return this._mesureIndicateurRepository;
  }

  getInformationMetadataIndicateurRepository(): InformationMetadataIndicateurRepository {
    return this._informationMetadataIndicateurRepository;
  }

  getPublierFichierIndicateurImporteUseCase(): PublierFichierIndicateurImporteUseCase {
    return this._publierFichierIndicateurImporteUseCase;
  }

  getVerifierFichierIndicateurImporteUseCase(): VerifierFichierIndicateurImporteUseCase {
    return this._verifierFichierIndicateurImporteUseCase;
  }

  getUtilisateurRepository() {
    return this._utilisateurRepository;
  }

  getTerritoireRepository() {
    return this._territoireRepository;
  }

  getFicheTerritorialeTerritoireRepository() {
    return this._ficheTerritorialeTerritoireRepository;
  }

  getProjetStructurantRepository() {
    return this._projetStructurantRepository;
  }

  getProfilRepository() {
    return this._profilRepository;
  }

  getObjectifProjetStructurantRepository() {
    return this._objectifProjetStructurantRepository;
  }

  getCommentaireProjetStructurantRepository(): CommentaireProjetStructurantRepository {
    return this._commentaireProjetStructurantRepository;
  }

  getPérimètreMinistérielRepository() {
    return this._périmètreMinistérielRepository;
  }

  getSynthèseDesRésultatsProjetStructurantRepository(): SynthèseDesRésultatsProjetStructurantRepository {
    return this._synthèseDesRésultatsProjetStructurantRepository;
  }

  getIndicateurProjetStructurantRepository() {
    return this._indicateurProjetStructurantRepository;
  }

  getUtilisateurIAMRepository(): UtilisateurIAMRepository {
    if (!this._utilisateurIAMRepository) {
      const keycloakUrl = process.env.IMPORT_KEYCLOAK_URL;
      assert.ok(keycloakUrl, 'IMPORT_KEYCLOAK_URL manquant.');
      const clientId = process.env.IMPORT_CLIENT_ID;
      assert.ok(clientId, 'IMPORT_CLIENT_ID manquant.');
      const clientSecret = process.env.IMPORT_CLIENT_SECRET;
      assert.ok(clientSecret, 'IMPORT_CLIENT_SECRET manquant.');

      this._utilisateurIAMRepository = new UtilisateurIAMKeycloakRepository(keycloakUrl, clientId, clientSecret);
    }
    return this._utilisateurIAMRepository;
  }
}

export const dependencies = new Dependencies();

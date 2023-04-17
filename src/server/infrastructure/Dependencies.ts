import { PrismaClient } from '@prisma/client';
import process from 'node:process';
import assert from 'node:assert/strict';
import ChantierSQLRepository from '@/server/infrastructure/accès_données/chantier/ChantierSQLRepository';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import IndicateurSQLRepository from '@/server/infrastructure/accès_données/indicateur/IndicateurSQLRepository';
import MinistèreSQLRepository from '@/server/infrastructure/accès_données/ministère/MinistèreSQLRepository';
import SynthèseDesRésultatsRepository
  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import {
  SynthèseDesRésultatsSQLRepository,
} from '@/server/infrastructure/accès_données/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import logger from '@/server/infrastructure/logger';
import AxeRepository from '@/server/domain/axe/AxeRepository.interface';
import AxeSQLRepository from '@/server/infrastructure/accès_données/axe/AxeSQLRepository';
import PpgRepository from '@/server/domain/ppg/PpgRepository.interface';
import PpgSQLRepository from '@/server/infrastructure/accès_données/ppg/PpgSQLRepository';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository from '@/server/infrastructure/accès_données/commentaire/CommentaireSQLRepository';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';
import HabilitationSQLRepository from '@/server/infrastructure/accès_données/identité/HabilitationSQLRepository';
import {
  ValiderFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/ValiderFichierIndicateurImporteUseCase';
import {
  ValidataFichierIndicateurValidationService,
} from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';
import { FetchHttpClient } from '@/server/import-indicateur/infrastructure/adapters/FetchHttpClient';
import {
  PrismaMesureIndicateurRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaMesureIndicateurRepository';
import { UtilisateurRepository } from '@/server/domain/identité/UtilisateurRepository';
import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/identité/UtilisateurSQLRepository';
import { UtilisateurIAMRepository } from '@/server/domain/identité/UtilisateurIAMRepository';
import UtilisateurIAMKeycloakRepository
  from '@/server/infrastructure/accès_données/identité/UtilisateurIAMKeycloakRepository';
import ObjectifSQLRepository from './accès_données/objectif/ObjectifSQLRepository';

class Dependencies {
  private readonly _chantierRepository: ChantierRepository;

  private readonly _axeRepository: AxeRepository;

  private readonly _ppgRepository: PpgRepository;

  private readonly _synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;

  private readonly _ministèreRepository: MinistèreRepository;

  private readonly _indicateurRepository: IndicateurRepository;

  private readonly _commentaireRepository: CommentaireRepository;

  private readonly _objectifRepository: ObjectifRepository;

  private readonly _habilitationRepository: HabilitationRepository;

  private readonly _validerFichierIndicateurImporteUseCase: ValiderFichierIndicateurImporteUseCase;

  private readonly _utilisateurRepository: UtilisateurRepository;

  private _utilisateurIAMRepository: UtilisateurIAMRepository | undefined;

  constructor() {
    logger.debug('Using database.');
    const prisma = new PrismaClient();
    this._chantierRepository = new ChantierSQLRepository(prisma);
    this._axeRepository = new AxeSQLRepository(prisma);
    this._ppgRepository = new PpgSQLRepository(prisma);
    this._ministèreRepository = new MinistèreSQLRepository(prisma);
    this._indicateurRepository = new IndicateurSQLRepository(prisma);
    this._synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
    this._commentaireRepository = new CommentaireSQLRepository(prisma);
    this._objectifRepository = new ObjectifSQLRepository(prisma);
    this._habilitationRepository = new HabilitationSQLRepository(prisma);
    this._utilisateurRepository = new UtilisateurSQLRepository(prisma);

    const httpClient = new FetchHttpClient();
    const prismaMesureIndicateurRepository = new PrismaMesureIndicateurRepository(prisma);
    const fichierIndicateurValidationService = new ValidataFichierIndicateurValidationService({ httpClient });
    this._validerFichierIndicateurImporteUseCase = new ValiderFichierIndicateurImporteUseCase({
      fichierIndicateurValidationService,
      mesureIndicateurRepository: prismaMesureIndicateurRepository,
    });
  }

  getChantierRepository(): ChantierRepository {
    return this._chantierRepository;
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

  getMinistèreRepository(): MinistèreRepository {
    return this._ministèreRepository;
  }

  getIndicateurRepository(): IndicateurRepository {
    return this._indicateurRepository;
  }

  getValiderFichierIndicateurImporteUseCase(): ValiderFichierIndicateurImporteUseCase {
    return this._validerFichierIndicateurImporteUseCase;
  }

  getHabilitationRepository() {
    return this._habilitationRepository;
  }

  getUtilisateurRepository() {
    return this._utilisateurRepository;
  }

  getUtilisateurIAMRepository(): UtilisateurIAMRepository {
    if (!this._utilisateurIAMRepository) {
      const keycloakUrl = process.env.IMPORT_KEYCLOAK_URL;
      assert(keycloakUrl);
      const clientId = process.env.IMPORT_CLIENT_ID;
      assert(clientId);
      const clientSecret = process.env.IMPORT_CLIENT_SECRET;
      assert(clientSecret);

      this._utilisateurIAMRepository = new UtilisateurIAMKeycloakRepository(keycloakUrl, clientId, clientSecret);
    }
    return this._utilisateurIAMRepository;
  }
}

export const dependencies = new Dependencies();

import { PrismaClient } from '@prisma/client';
import ChantierSQLRepository from '@/server/infrastructure/chantier/ChantierSQLRepository';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import ChantierRandomRepository from '@/server/infrastructure/chantier/ChantierRandomRepository';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import IndicateurSQLRepository from '@/server/infrastructure/indicateur/IndicateurSQLRepository';
import IndicateurRandomRepository from '@/server/infrastructure/indicateur/IndicateurRandomRepository';
import MinistèreSQLRepository from '@/server/infrastructure/ministère/MinistèreSQLRepository';
import MinistèreInMemoryRepository from '@/server/infrastructure/ministère/MinistèreInMemoryRepository';
import SynthèseDesRésultatsRepository from '@/server/domain/chantier/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultatsRandomRepository
  from '@/server/infrastructure/chantier/SynthèseDesRésultatsRandomRepository';
import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/chantier/SynthèseDesRésultatsSQLRepository';
import config from '@/server/infrastructure/Configuration';
import logger from '@/server/infrastructure/logger';
import AxeRepository from '@/server/domain/axe/AxeRepository.interface';
import AxeRandomRepository from '@/server/infrastructure/axe/AxeRandomRepository';
import AxeSQLRepository from '@/server/infrastructure/axe/AxeSQLRepository';
import PpgRepository from '@/server/domain/ppg/PpgRepository.interface';
import PpgSQLRepository from '@/server/infrastructure/ppg/PpgSQLRepository';
import PpgRandomRepository from '@/server/infrastructure/ppg/PpgRandomRepository';
import AxeFixture from '@/fixtures/AxeFixture';
import PpgFixture from '@/fixtures/PpgFixture';

class Dependencies {
  private readonly _chantierRepository: ChantierRepository;

  private readonly _axeRepository: AxeRepository;

  private readonly _ppgRepository: PpgRepository;

  private readonly _synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;

  private readonly _ministèreRepository: MinistèreRepository;

  private readonly _indicateurRepository: IndicateurRepository;

  constructor() {
    if (config.isUsingDatabase) {
      logger.info('Using database.');
      const prisma = new PrismaClient();
      this._chantierRepository = new ChantierSQLRepository(prisma);
      this._axeRepository = new AxeSQLRepository(prisma);
      this._ppgRepository = new PpgSQLRepository(prisma);
      this._ministèreRepository = new MinistèreSQLRepository(prisma);
      this._indicateurRepository = new IndicateurSQLRepository(prisma);
      this._synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
    } else {
      logger.debug('Not using database.');
      const nombreDeChantiers = 500;
      const idPérimètres = [ { id: 'PER-001' }, { id: 'PER-002' }, { id: 'PER-003' }, { id: 'PER-004' } ];
      const axes =  AxeFixture.générerPlusieurs(5);
      const ppgs =  PpgFixture.générerPlusieurs(60, [{ id: 'PPG-004', nom: 'PPG numéro 4 dont le libellé est de loin le plus grand de l\'ensemble du jeu de test, il prend beaucoup de place' }] );
      const valeursFixes = [];
      const nbPérimètres = idPérimètres.length;
      for (let i = 0; i < nombreDeChantiers; i = i + 1) {
        valeursFixes.push({
          périmètreIds : [idPérimètres[i % (nbPérimètres - 1)].id],
          axe : axes[i % (axes.length - 1)].nom,
          ppg : ppgs[i % (ppgs.length - 1)].nom,
        });
      }

      this._chantierRepository = new ChantierRandomRepository(valeursFixes);
      this._axeRepository = new AxeRandomRepository(axes);
      this._ppgRepository = new PpgRandomRepository(ppgs);
      this._synthèseDesRésultatsRepository = new SynthèseDesRésultatsRandomRepository();
      this._ministèreRepository = new MinistèreInMemoryRepository();
      this._indicateurRepository = new IndicateurRandomRepository();
    }
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

  getMinistèreRepository(): MinistèreRepository {
    return this._ministèreRepository;
  }

  getIndicateurRepository(): IndicateurRepository {
    return this._indicateurRepository;
  }
}

export const dependencies = new Dependencies();

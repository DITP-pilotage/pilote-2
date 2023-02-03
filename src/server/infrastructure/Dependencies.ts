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

class Dependencies {
  private readonly _chantierRepository: ChantierRepository;

  private readonly _ministèreRepository: MinistèreRepository;

  private readonly _indicateurRepository: IndicateurRepository;

  constructor() {
    if (process.env.USE_DATABASE == 'true') {
      const prisma = new PrismaClient();
      this._chantierRepository = new ChantierSQLRepository(prisma);
      this._ministèreRepository = new MinistèreSQLRepository(prisma);
      this._indicateurRepository = new IndicateurSQLRepository(prisma);
    } else {
      const nombreDeChantiers = 120;
      const idPérimètres = [ { id: 'PER-001' }, { id: 'PER-002' }, { id: 'PER-003' }, { id: 'PER-004' } ];
      const valeursFixes = [];
      const nbPérimètres = idPérimètres.length;
      for (let i = 0; i < nombreDeChantiers; i = i + 1) {
        valeursFixes.push({ périmètreIds : [idPérimètres[i % (nbPérimètres - 1)].id] });
      }

      this._chantierRepository = new ChantierRandomRepository(valeursFixes);
      this._ministèreRepository = new MinistèreInMemoryRepository();
      this._indicateurRepository = new IndicateurRandomRepository();
    }
  }

  getChantierRepository(): ChantierRepository {
    return this._chantierRepository;
  }

  getMinistèreRepository(): MinistèreRepository {
    return this._ministèreRepository;
  }


  getIndicateurRepository(): IndicateurRepository {
    return this._indicateurRepository;
  }
}

export const dependencies = new Dependencies();

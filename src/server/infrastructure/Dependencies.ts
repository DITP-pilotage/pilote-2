import { PrismaClient } from '@prisma/client';
import ChantierSQLRepository from '@/server/infrastructure/chantier/ChantierSQLRepository';
import PérimètreMinistérielSQLRepository from '@/server/infrastructure/périmètreMinistériel/PérimètreMinistérielSQLRepository';
import PérimètreMinistérielRandomRepository from '@/server/infrastructure/périmètreMinistériel/PérimètreMinistérielRandomRepository';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import ChantierRandomRepository from '@/server/infrastructure/chantier/ChantierRandomRepository';

class Dependencies {
  private readonly _chantierRepository: ChantierRepository;

  private readonly _périmètreMinistérielRepository: PérimètreMinistérielRepository;

  constructor() {
    if (process.env.USE_DATABASE == 'true') {
      const prisma = new PrismaClient();
      this._périmètreMinistérielRepository = new PérimètreMinistérielSQLRepository(prisma);
      this._chantierRepository = new ChantierSQLRepository(prisma);

    } else {
      const nombreDeChantiers = 120;
      const idPérimètres = [ { id: 'PER-001' }, { id: 'PER-002' }, { id: 'PER-003' }, { id: 'PER-004' } ];
      const valeursFixes = [];
      const nbPérimètres = idPérimètres.length;
      for (let i = 0; i < nombreDeChantiers; i = i + 1) {
        valeursFixes.push({ périmètreIds : [idPérimètres[i % (nbPérimètres - 1)].id] });
      }

      this._périmètreMinistérielRepository = new PérimètreMinistérielRandomRepository(idPérimètres);
      this._chantierRepository = new ChantierRandomRepository(valeursFixes);
    }
  }

  getChantierRepository(): ChantierRepository {
    return this._chantierRepository;
  }

  getPerimètreMinistérielRepository(): PérimètreMinistérielRepository {
    return this._périmètreMinistérielRepository;
  }
}

export const dependencies = new Dependencies();

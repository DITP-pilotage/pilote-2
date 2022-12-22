import { PrismaClient } from '@prisma/client';
import ChantierSQLRepository from '@/server/infrastructure/chantier/ChantierSQLRepository';
import ChantierInfoSQLRepository from '@/server/infrastructure/chantier/ChantierInfoSQLRepository';
import PérimètreMinistérielSQLRepository from '@/server/infrastructure/périmètreMinistériel/PérimètreMinistérielSQLRepository';
import PérimètreMinistérielRandomRepository from '@/server/infrastructure/périmètreMinistériel/PérimètreMinistérielRandomRepository';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import ChantierRandomRepository from '@/server/infrastructure/chantier/ChantierRandomRepository';
import ChantierInfoRandomRepository from '@/server/infrastructure/chantier/ChantierInfoRandomRepository';

class Dependencies {
  private readonly _chantierRepository: ChantierRepository;

  private readonly _chantierInfoRepository: ChantierInfoRepository;

  private readonly _périmètreMinistérielRepository: PérimètreMinistérielRepository;

  constructor() {
    if (process.env.USE_DATABASE == 'true') {
      const prisma = new PrismaClient();
      this._périmètreMinistérielRepository = new PérimètreMinistérielSQLRepository(prisma);
      this._chantierRepository = new ChantierSQLRepository(prisma);
      this._chantierInfoRepository = new ChantierInfoSQLRepository(prisma);

    } else {
      const idPérimètres = [ { id: 'PER-001' }, { id: 'PER-002' }, { id: 'PER-003' }, { id: 'PER-004' } ];
      this._périmètreMinistérielRepository = new PérimètreMinistérielRandomRepository(idPérimètres);
      this._chantierInfoRepository = new ChantierInfoRandomRepository(120, idPérimètres);
      this._chantierRepository = new ChantierRandomRepository();
    }
  }

  getChantierRepository(): ChantierRepository {
    return this._chantierRepository;
  }

  getChantierInfoRepository(): ChantierInfoRepository {
    return this._chantierInfoRepository;
  }

  getPerimètreMinistérielRepository(): PérimètreMinistérielRepository {
    return this._périmètreMinistérielRepository;
  }
}

export const dependencies = new Dependencies();

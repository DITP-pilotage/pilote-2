import { PrismaClient } from '@prisma/client';
import ChantierSQLRepository from '@/server/infrastructure/ChantierSQLRepository';
import PérimètreMinistérielSQLRepository from '@/server/infrastructure/PérimètreMinistérielSQLRepository';
import PérimètreMinistérielRandomRepository from '@/server/infrastructure/PérimètreMinistérielRandomRepository';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import ChantierRandomRepository from '@/server/infrastructure/ChantierRandomRepository';

class Dependencies {
  private chantierRepository: ChantierRepository;

  private périmètreMinistérielRepository: PérimètreMinistérielRepository;

  constructor() {
    if (process.env.USE_DATABASE == 'true') {
      const prisma = new PrismaClient();
      this.périmètreMinistérielRepository = new PérimètreMinistérielSQLRepository(prisma);
      this.chantierRepository = new ChantierSQLRepository(prisma);

    } else {
      const idPérimètres = [ { id: 'PER-001' }, { id: 'PER-002' }, { id: 'PER-003' }, { id: 'PER-004' } ];
      this.périmètreMinistérielRepository = new PérimètreMinistérielRandomRepository(idPérimètres);
      this.chantierRepository = new ChantierRandomRepository(120, idPérimètres);
    }
  }

  getChantierRepository(): ChantierRepository {
    return this.chantierRepository;
  }

  getPerimètreMinistérielRepository(): PérimètreMinistérielRepository {
    return this.périmètreMinistérielRepository;
  }
}

export const dependencies = new Dependencies();

import { chantier as chantierPrisma } from '@prisma/client';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { objectEntries } from '@/client/utils/objects/objects';

export default class RécupérerChantiersUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
    private readonly ministèreRepository: MinistèreRepository = dependencies.getMinistèreRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}

  async run(): Promise<Chantier[]> {
    const ministères = await this.ministèreRepository.getListe();
    const territoires = await this.territoireRepository.récupérerTous();
    const chantiersRows = await this.chantierRepository.récupérerTous();

    const chantiersGroupésParId = groupBy<chantierPrisma>(chantiersRows, chantier => chantier.id);
    return objectEntries(chantiersGroupésParId).map(([_, chantier]) => parseChantier(chantier, territoires, ministères));
  }
}

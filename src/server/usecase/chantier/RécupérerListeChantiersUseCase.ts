import { chantier } from '@prisma/client';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import { groupBy } from '@/client/utils/arrays';
import { objectEntries } from '@/client/utils/objects/objects';

export default class RécupérerListeChantiersUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
    private readonly ministèreRepository: MinistèreRepository = dependencies.getMinistèreRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}

  async run(habilitation: Habilitation): Promise<Chantier[]> {
    const ministères = await this.ministèreRepository.getListe();
    const territoires = await this.territoireRepository.récupérerTous();
    const chantiersRows = await this.chantierRepository.récupérerLesEntréesDeTousLesChantiersHabilités(habilitation);
    const chantiersGroupésParId = groupBy<chantier>(chantiersRows, c => c.id);
    return objectEntries(chantiersGroupésParId).map(([_, c]) => parseChantier(c, territoires, ministères));
  }
}

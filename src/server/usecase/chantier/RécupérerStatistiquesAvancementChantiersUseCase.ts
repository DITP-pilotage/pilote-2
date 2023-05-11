import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export default class RécupérerStatistiquesAvancementChantiersUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(chantiers: Chantier['id'][], maille: Maille, habilitations: Habilitations): Promise<AvancementsStatistiques> {
    return this.chantierRepository.getChantierStatistiques(habilitations, chantiers, maille);
  }
}

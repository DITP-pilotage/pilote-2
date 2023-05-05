import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';

export default class RécupérerStatistiquesAvancementChantiersUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(chantiers: string[], maille: string): Promise<AvancementsStatistiques> {
    //return this.chantierRepository.getById(chantierId, habilitations);
    return;
  }
}

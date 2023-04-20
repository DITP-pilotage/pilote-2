import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Habilitation } from '@/server/domain/identité/Habilitation';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default class RécupérerChantierUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(chantierId: string, habilitation: Habilitation, scope: string): Promise<Chantier> {
    return this.chantierRepository.getById(chantierId, habilitation, scope);
  }
}

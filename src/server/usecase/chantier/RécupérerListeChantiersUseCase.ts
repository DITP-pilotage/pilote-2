import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class RécupérerListeChantiersUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(habilitation: Habilitation): Promise<Chantier[]> {
    return this.chantierRepository.récupérerListe(habilitation);
  }
}

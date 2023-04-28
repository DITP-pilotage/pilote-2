import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerChantierUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(chantierId: string, habilitation: Utilisateur['scopes']): Promise<Chantier> {
    return this.chantierRepository.getById(chantierId, habilitation);
  }
}

import { dependencies } from '@/server/infrastructure/Dependencies';
import DécisionStratégiqueRepository from '@/server/domain/décisionStratégique/DécisionStratégiqueRepository.interface';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerDécisionStratégiqueLaPlusRécenteUseCase {
  constructor(
    private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository = dependencies.getDécisionStratégiqueRepository(),
  ) {}

  async run(chantierId: string, habilitations: Habilitations): Promise<DécisionStratégique> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, 'NAT-FR');
    
    return this.décisionStratégiqueRepository.récupérerLaPlusRécente(chantierId);
  }
}

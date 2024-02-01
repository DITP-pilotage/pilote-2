import DécisionStratégiqueRepository
  from '@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface';
import DécisionStratégique from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerDécisionStratégiqueLaPlusRécenteUseCase {
  constructor(
    private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository,
  ) {}

  async run(chantierId: string, habilitations: Habilitations): Promise<DécisionStratégique> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, 'NAT-FR');
    
    return this.décisionStratégiqueRepository.récupérerLaPlusRécente(chantierId);
  }
}

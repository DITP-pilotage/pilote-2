import { DécisionStratégiqueRepository } from '@/server/chantiers/domain/ports/DecisionStrategiqueRepository';
import { DécisionStratégique } from '@/server/chantiers/domain/DecisionStrategique.interface';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

type Dependencies = {
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
};

export class RécupérerDécisionStratégiqueLaPlusRécenteUseCase {
  private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository;

  constructor({ décisionStratégiqueRepository }: Dependencies) {
    this.décisionStratégiqueRepository = décisionStratégiqueRepository;
  }

  async run(chantierId: string, habilitations: Habilitations): Promise<DécisionStratégique> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, 'NAT-FR');
    
    return this.décisionStratégiqueRepository.récupérerLaPlusRécente(chantierId);
  }
}

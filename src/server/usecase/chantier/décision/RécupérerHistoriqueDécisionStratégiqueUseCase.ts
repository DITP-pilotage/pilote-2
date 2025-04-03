import { DécisionStratégiqueRepository } from '@/server/chantiers/domain/ports/DecisionStrategiqueRepository';
import { DécisionStratégique } from '@/server/chantiers/domain/DecisionStrategique.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';

type Dependencies = {
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
};

export class RécupérerHistoriqueDécisionStratégiqueUseCase {
  private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository;

  constructor({ décisionStratégiqueRepository }: Dependencies) {
    this.décisionStratégiqueRepository = décisionStratégiqueRepository;
  }

  async run(chantierId: string, habilitations: Habilitations): Promise<DécisionStratégique[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, 'NAT-FR');
    
    return this.décisionStratégiqueRepository.récupérerHistorique(chantierId);
  }
}

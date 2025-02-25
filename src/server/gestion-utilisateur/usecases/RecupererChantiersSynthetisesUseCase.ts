import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { ChantierRepository } from '@/server/gestion-utilisateur/domain/ports/ChantierRepository';

interface Dependencies {
  chantierRepository: ChantierRepository
}

export class RecupererChantiersSynthetisesUseCase {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository } : Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  async run({ listeChantierIdLecture }:  { listeChantierIdLecture: string[] }): Promise<ChantierSynthétisé[]> {
    return this.chantierRepository.récupérerChantiersSynthétisés({ listeChantierIdLecture });
  }
}

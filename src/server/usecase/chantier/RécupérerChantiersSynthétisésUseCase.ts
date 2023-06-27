import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerChantiersSynthétisésUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(habilitations: Habilitations): Promise<ChantierSynthétisé[]> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    
    const chantiersSynthétisés = await this.chantierRepository.récupérerChantiersSynthétisés();

    return chantiersSynthétisés.filter(c => chantiersLecture.includes(c.id));
  }
}

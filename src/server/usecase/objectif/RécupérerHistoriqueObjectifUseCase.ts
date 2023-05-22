import { dependencies } from '@/server/infrastructure/Dependencies';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import Objectif, { TypeObjectif } from '@/server/domain/objectif/Objectif.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerHistoriqueObjectifUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository = dependencies.getObjectifRepository(),
  ) {}

  async run(chantierId: string, type: TypeObjectif, habilitations: Habilitations): Promise<Objectif[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);
    
    return this.objectifRepository.récupérerHistorique(chantierId, type);
  }
}

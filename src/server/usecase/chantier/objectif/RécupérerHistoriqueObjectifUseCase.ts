import { ObjectifRepository } from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import { Objectif, TypeObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

type Dependencies = {
  objectifRepository: ObjectifRepository;
};

export class RécupérerHistoriqueObjectifUseCase {
  private readonly objectifRepository: ObjectifRepository;

  constructor({ objectifRepository }: Dependencies) {
    this.objectifRepository = objectifRepository;
  }

  async run(chantierId: string, type: TypeObjectif, habilitations: Habilitations): Promise<Objectif[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);
    
    return this.objectifRepository.récupérerHistorique(chantierId, type);
  }
}

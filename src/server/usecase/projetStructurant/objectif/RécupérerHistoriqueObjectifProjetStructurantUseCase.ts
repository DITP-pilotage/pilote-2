import { dependencies } from '@/server/infrastructure/Dependencies';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import ObjectifProjetStructurant, { TypeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';

export default class RécupérerHistoriqueObjectifProjetStructurantUseCase {
  constructor(
    private readonly objectifRepository: ObjectifProjetStructurantRepository = dependencies.getObjectifProjetStructurantRepository(),
  ) {}

  async run(projetStructurantId: string, type: TypeObjectifProjetStructurant, habilitations: Habilitations): Promise<ObjectifProjetStructurant[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);
    
    return this.objectifRepository.récupérerHistorique(projetStructurantId, type);
  }
}

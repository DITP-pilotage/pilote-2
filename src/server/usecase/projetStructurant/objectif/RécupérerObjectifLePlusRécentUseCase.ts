import ObjectifProjetStructurant from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ObjectifProjetStructurantRepository
  from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerObjectifProjetStructurantLePlusRécentUseCase {
  constructor(
    private readonly objectifRepository: ObjectifProjetStructurantRepository,
  ) {}

  async run(projetStructurantId: string, habilitations: Habilitations): Promise<ObjectifProjetStructurant> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);
    
    return this.objectifRepository.récupérerLePlusRécent(projetStructurantId);
  }
}

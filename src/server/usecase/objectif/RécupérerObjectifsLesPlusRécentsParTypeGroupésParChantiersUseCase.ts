import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase {
  constructor(
    private readonly objectifRepository: ObjectifRepository = dependencies.getObjectifRepository(),
  ) {}

  async run(chantierIds: string[], habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    chantierIds.forEach(chantierId => {
      habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);
    });

    return this.objectifRepository.récupérerLesPlusRécentsGroupésParChantier(chantierIds);
  }
}

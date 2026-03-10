import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

export default class RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase {
  private readonly objectifRepository: ObjectifRepository;

  constructor({ objectifRepository }: { objectifRepository: ObjectifRepository }) {
    this.objectifRepository = objectifRepository;
  }

  async run(chantierIds: string[], habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    chantierIds.forEach((chantierId) => {
      habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);
    });

    return this.objectifRepository.récupérerLesPlusRécentsGroupésParChantier(
      chantierIds,
    );
  }
}

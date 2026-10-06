import { ObjectifRepository } from "@/server/objectifs/infrastructure/sql/ObjectifRepository.interface";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

export class RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase {
  private readonly objectifRepository: ObjectifRepository;

  constructor({
    objectifRepository,
  }: {
    objectifRepository: ObjectifRepository;
  }) {
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

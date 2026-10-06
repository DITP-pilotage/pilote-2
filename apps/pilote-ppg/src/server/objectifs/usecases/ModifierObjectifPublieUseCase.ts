import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { ObjectifRepository } from "@/server/objectifs/infrastructure/sql/ObjectifRepository.interface";
import { modifierObjectifPublie } from "@/server/objectifs/domain/Objectif";

export class ModifierObjectifPublieUseCase {
  constructor(
    private readonly dependencies: {
      objectifRepository: ObjectifRepository;
    },
  ) {}

  async execute({
    objectifId,
    contenu,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    objectifId: string;
    contenu: string;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const objectifAModifier =
      await this.dependencies.objectifRepository.getById(objectifId);

    if (!objectifAModifier)
      throw new Error(`Objectif introuvable : ${objectifId}`);

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      objectifAModifier.chantierId,
      "NAT-FR",
    );

    const objectif = modifierObjectifPublie(objectifAModifier, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.objectifRepository.save(objectif);
  }
}

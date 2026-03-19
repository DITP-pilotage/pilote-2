import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import { modifierObjectifPublie } from "@/server/domain/chantier/objectif/Objectif";

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

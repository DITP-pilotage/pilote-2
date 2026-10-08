import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { ObjectifRepository } from "@/server/objectifs/infrastructure/sql/ObjectifRepository.interface";
import { modifierObjectifBrouillon } from "@/server/objectifs/domain/Objectif";

export class ModifierBrouillonObjectifUseCase {
  constructor(
    private readonly dependencies: {
      objectifRepository: ObjectifRepository;
    },
  ) {}

  async execute({
    brouillonId,
    contenu,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    brouillonId: string;
    contenu: string;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const brouillon =
      await this.dependencies.objectifRepository.getById(brouillonId);

    if (!brouillon) throw new Error(`Brouillon introuvable : ${brouillonId}`);

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      brouillon.chantierId,
      "NAT-FR",
    );

    const objectif = modifierObjectifBrouillon(brouillon, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.objectifRepository.save(objectif);
  }
}

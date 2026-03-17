import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import { modifierObjectifBrouillon } from "@/server/domain/chantier/objectif/Objectif";

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
    const brouillon = await this.dependencies.objectifRepository.getById(brouillonId);

    if (!brouillon) throw new Error(`Brouillon introuvable : ${brouillonId}`);

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(brouillon.chantierId, "NAT-FR");

    const objectif = modifierObjectifBrouillon(brouillon, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.objectifRepository.save(objectif);
  }
}

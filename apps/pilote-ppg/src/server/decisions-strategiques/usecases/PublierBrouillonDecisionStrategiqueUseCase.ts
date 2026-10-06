import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { DécisionStratégiqueRepository } from "@/server/decisions-strategiques/infrastructure/sql/DecisionStrategiqueRepository.interface";
import { publierBrouillonDecisionStrategique } from "@/server/decisions-strategiques/domain/DecisionStrategique";

export class PublierBrouillonDecisionStrategiqueUseCase {
  constructor(
    private readonly dependencies: {
      décisionStratégiqueRepository: DécisionStratégiqueRepository;
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
      await this.dependencies.décisionStratégiqueRepository.getById(
        brouillonId,
      );

    if (!brouillon) throw new Error(`Brouillon introuvable : ${brouillonId}`);

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      brouillon.chantierId,
      "NAT-FR",
    );

    const decision = publierBrouillonDecisionStrategique(brouillon, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.décisionStratégiqueRepository.save(decision);
  }
}

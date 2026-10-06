import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { DécisionStratégiqueRepository } from "@/server/decisions-strategiques/infrastructure/sql/DecisionStrategiqueRepository.interface";
import { modifierDecisionStrategiquePubliee } from "@/server/decisions-strategiques/domain/DecisionStrategique";

export class ModifierDecisionStrategiquePublieeUseCase {
  constructor(
    private readonly dependencies: {
      décisionStratégiqueRepository: DécisionStratégiqueRepository;
    },
  ) {}

  async execute({
    decisionStrategiqueId,
    contenu,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    decisionStrategiqueId: string;
    contenu: string;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const decisionAModifier =
      await this.dependencies.décisionStratégiqueRepository.getById(
        decisionStrategiqueId,
      );

    if (!decisionAModifier)
      throw new Error(
        `Décision stratégique introuvable : ${decisionStrategiqueId}`,
      );

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      decisionAModifier.chantierId,
      "NAT-FR",
    );

    const decision = modifierDecisionStrategiquePubliee(decisionAModifier, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.décisionStratégiqueRepository.save(decision);
  }
}

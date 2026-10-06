import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { TypeDecisionStrategique } from "@/shared/chantier/decisionStrategique/DecisionStrategique.interface";
import { DécisionStratégiqueRepository } from "@/server/decisions-strategiques/infrastructure/sql/DecisionStrategiqueRepository.interface";
import { creerDecisionStrategiqueBrouillon } from "@/server/decisions-strategiques/domain/DecisionStrategique";

export class EnregistrerBrouillonDecisionStrategiqueUseCase {
  constructor(
    private readonly dependencies: {
      décisionStratégiqueRepository: DécisionStratégiqueRepository;
    },
  ) {}

  async execute({
    chantierId,
    type,
    contenu,
    auteurId,
    date,
    habilitations,
  }: {
    chantierId: string;
    type: TypeDecisionStrategique;
    contenu: string;
    auteurId: string;
    date: string;
    habilitations: Habilitations;
  }): Promise<void> {
    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(chantierId, "NAT-FR");

    const decision = creerDecisionStrategiqueBrouillon({
      chantierId,
      type,
      contenu,
      auteurId,
      date,
    });

    await this.dependencies.décisionStratégiqueRepository.save(decision);
  }
}

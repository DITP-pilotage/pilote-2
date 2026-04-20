import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { TypeDecisionStrategique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import { creerDecisionStrategiqueBrouillon } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique";

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

import { randomUUID } from "node:crypto";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import {
  ImportDecisionStrategiqueInput,
  mapTypeDecisionStrategiqueAPIVersDomaine,
} from "@/validation/import-decision-strategique";
import { DécisionStratégiqueV2 } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";

export class ImporterDecisionsStrategiquesUseCase {
  constructor(
    private readonly dependencies: {
      décisionStratégiqueRepository: DécisionStratégiqueRepository;
    },
  ) {}

  async execute({
    chantierId,
    decisionsStrategiques,
    auteurId,
  }: {
    chantierId: string;
    decisionsStrategiques: ImportDecisionStrategiqueInput[];
    auteurId: string;
  }): Promise<void> {
    for (const decision of decisionsStrategiques) {
      const id = randomUUID();
      const date = decision.date_decision_strategique
        ? new Date(decision.date_decision_strategique)
        : new Date();

      const typeDomaine = mapTypeDecisionStrategiqueAPIVersDomaine(
        decision.type,
      );

      const décisionV2: DécisionStratégiqueV2 = {
        chantierId,
        id,
        contenu: decision.contenu,
        type: typeDomaine,
        auteur_id: auteurId,
        date,
      };

      await this.dependencies.décisionStratégiqueRepository.save(décisionV2);
    }
  }
}

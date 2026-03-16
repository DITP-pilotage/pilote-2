import { randomUUID } from "node:crypto";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import {
  ImportDecisionStrategiqueInput,
  mapTypeDecisionStrategiqueAPIVersDomaine,
} from "@/validation/import-decision-strategique";
import { DecisionStrategiqueV2 } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import type { Inject } from "@/server/decisions-strategiques/module";

export class ImporterDecisionsStrategiquesUseCase {
  private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository;

  constructor({
    décisionStratégiqueRepository,
  }: Inject<"décisionStratégiqueRepository">) {
    this.décisionStratégiqueRepository = décisionStratégiqueRepository;
  }

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

      const décisionV2: DecisionStrategiqueV2 = {
        chantierId,
        id,
        contenu: decision.contenu,
        type: typeDomaine,
        auteur_id: auteurId,
        date,
      };

      await this.décisionStratégiqueRepository.save(décisionV2);
    }
  }
}

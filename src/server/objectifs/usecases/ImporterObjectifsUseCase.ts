import { randomUUID } from "node:crypto";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import {
  ImportObjectifInput,
  mapTypeObjectifAPIVersDomaine,
} from "@/validation/import-objectif";
import { ObjectifV2 } from "@/server/domain/chantier/objectif/Objectif.interface";

export class ImporterObjectifsUseCase {
  constructor(
    private readonly dependencies: {
      objectifRepository: ObjectifRepository;
    },
  ) {}

  async execute({
    chantierId,
    objectifs,
    auteurId,
  }: {
    chantierId: string;
    objectifs: ImportObjectifInput[];
    auteurId: string;
  }): Promise<void> {
    for (const objectif of objectifs) {
      const id = randomUUID();
      const date = objectif.date_objectif
        ? new Date(objectif.date_objectif)
        : new Date();

      const typeDomaine = mapTypeObjectifAPIVersDomaine(objectif.type);

      const objectifV2: ObjectifV2 = {
        chantierId,
        id,
        contenu: objectif.contenu,
        type: typeDomaine,
        auteur_id: auteurId,
        date,
      };

      await this.dependencies.objectifRepository.save(objectifV2);
    }
  }
}

import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import {
  ImportObjectifInput,
  mapTypeObjectifAPIVersDomaine,
} from "@/validation/import-objectif";
import { ObjectifV2 } from "@/server/domain/chantier/objectif/Objectif.interface";
import type { Inject } from "@/server/objectifs/module";

export class ImporterObjectifsUseCase {
  private readonly objectifRepository: ObjectifRepository;

  constructor({ objectifRepository }: Inject<"objectifRepository">) {
    this.objectifRepository = objectifRepository;
  }

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
        auteurCreationId: auteurId,
        auteurModificationId: auteurId,
        dateCreation: date.toISOString(),
        dateModification: date.toISOString(),
        statut: $Enums.statut_publication.PUBLIE,
      };

      await this.objectifRepository.save(objectifV2);
    }
  }
}

import { randomUUID } from "node:crypto";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import Objectif, {
  TypeObjectif,
} from "@/server/domain/chantier/objectif/Objectif.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import type { Inject } from "@/server/legacy/module";

export default class CréerUnObjectifUseCase {
  private readonly objectifRepository: ObjectifRepository;

  constructor({ objectifRepository }: Inject<"objectifRepository">) {
    this.objectifRepository = objectifRepository;
  }

  async run(
    chantierId: string,
    contenu: string,
    auteur_id: string,
    type: TypeObjectif,
    habilitations: Habilitations,
  ): Promise<Objectif> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(
      chantierId,
      "NAT-FR",
    );

    const date = new Date();
    const id = randomUUID();
    return this.objectifRepository.créer(
      chantierId,
      id,
      contenu,
      auteur_id,
      type,
      date,
    );
  }
}

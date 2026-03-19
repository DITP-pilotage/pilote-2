import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { TypeObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import { creerObjectifPublie } from "@/server/domain/chantier/objectif/Objectif";

export class PublierObjectifUseCase {
  constructor(
    private readonly dependencies: {
      objectifRepository: ObjectifRepository;
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
    type: TypeObjectif;
    contenu: string;
    auteurId: string;
    date: string;
    habilitations: Habilitations;
  }): Promise<void> {
    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(chantierId, "NAT-FR");

    const objectif = creerObjectifPublie({
      chantierId,
      type,
      contenu,
      auteurId,
      date,
    });

    await this.dependencies.objectifRepository.save(objectif);
  }
}

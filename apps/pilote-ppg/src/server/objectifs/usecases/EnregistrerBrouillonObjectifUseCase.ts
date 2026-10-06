import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { TypeObjectif } from "@/shared/chantier/objectif/Objectif.interface";
import { ObjectifRepository } from "@/server/objectifs/infrastructure/sql/ObjectifRepository.interface";
import { creerObjectifBrouillon } from "@/server/objectifs/domain/Objectif";

export class EnregistrerBrouillonObjectifUseCase {
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

    const objectif = creerObjectifBrouillon({
      chantierId,
      type,
      contenu,
      auteurId,
      date,
    });

    await this.dependencies.objectifRepository.save(objectif);
  }
}

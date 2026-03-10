import { randomUUID } from "node:crypto";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import DécisionStratégique from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";

export default class CréerUneDécisionStratégiqueUseCase {
  private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository;

  constructor({ décisionStratégiqueRepository }: { décisionStratégiqueRepository: DécisionStratégiqueRepository }) {
    this.décisionStratégiqueRepository = décisionStratégiqueRepository;
  }

  async run(
    chantierId: Chantier["id"],
    contenu: string,
    auteur_id: string,
    habilitations: Habilitations,
  ): Promise<DécisionStratégique> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(
      chantierId,
      "NAT-FR",
    );

    const date = new Date();
    const id = randomUUID();
    const type = "suiviDesDécisionsStratégiques";
    return this.décisionStratégiqueRepository.créer(
      chantierId,
      id,
      contenu,
      type,
      auteur_id,
      date,
    );
  }
}

import { Météo } from "@/server/domain/météo/Météo.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { creerSyntheseDesResultatsBrouillon } from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";

export class EnregistrerBrouillonSyntheseDesResultatsUseCase {
  constructor(
    private readonly dependencies: {
      enregistrerSyntheseDesResultatsService: EnregistrerSyntheseDesResultatsService;
    },
  ) {}

  async execute({
    chantierId,
    territoireCode,
    contenu,
    meteo,
    auteurId,
    date,
    habilitations,
  }: {
    chantierId: string;
    territoireCode: string;
    contenu: string;
    meteo: Météo;
    auteurId: string;
    date: string;
    habilitations: Habilitations;
  }): Promise<void> {
    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      chantierId,
      territoireCode,
    );

    const synthese = creerSyntheseDesResultatsBrouillon({
      chantierId,
      territoireCode,
      contenu,
      meteo,
      auteurId,
      date,
    });

    await this.dependencies.enregistrerSyntheseDesResultatsService.enregistrer(
      synthese,
    );
  }
}

import { Meteo } from "@/shared/meteo/Meteo.interface";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { creerSyntheseDesResultatsPublie } from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";

export class PublierSyntheseDesResultatsUseCase {
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
    meteo: Meteo;
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

    const synthese = creerSyntheseDesResultatsPublie({
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

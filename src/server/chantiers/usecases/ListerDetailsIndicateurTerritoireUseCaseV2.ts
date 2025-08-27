import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import {
  DetailsIndicateursTerritoireContrat,
  presenterEnDetailsIndicateursTerritoireContrat,
} from "@/server/chantiers/app/contrats/DetailsIndicateursTerritoireContrat";

export class ListerDetailsIndicateurTerritoireUseCaseV2 {
  private readonly indicateurRepository: IndicateurRepository;

  constructor({
    indicateurRepository,
  }: {
    indicateurRepository: IndicateurRepository;
  }) {
    this.indicateurRepository = indicateurRepository;
  }

  async run(
    listeIndicateurId: string[],
    chantierId: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
  ) {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);

    const resultDétailsParMailles = await Promise.all(
      listeIndicateurId.map((indicateurId) =>
        this.indicateurRepository
          .récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            profil,
            jalon,
          )
          .then((detailsTerritoire) => ({
            id: indicateurId,
            detailsTerritoire,
          })),
      ),
    );

    return resultDétailsParMailles.reduce(
      (acc, val) => {
        acc[val.id] = presenterEnDetailsIndicateursTerritoireContrat(
          val.detailsTerritoire,
        );
        return acc;
      },
      {} as Record<string, DetailsIndicateursTerritoireContrat>,
    );
  }
}

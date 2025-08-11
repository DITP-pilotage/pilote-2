import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { presenterEnDetailsIndicateursContrat } from "@/server/chantiers/app/contrats/DetailsIndicateursContrat";

export class RecupererDetailsIndicateursV2UseCase {
  private readonly indicateurRepository: IndicateurRepository;

  constructor({
    indicateurRepository,
  }: {
    indicateurRepository: IndicateurRepository;
  }) {
    this.indicateurRepository = indicateurRepository;
  }

  async run(
    chantierId: string,
    territoireCodes: string[],
    habilitations: Habilitations,
    jalon: number,
  ) {
    const habilitation = new Habilitation(habilitations);
    territoireCodes.forEach((territoireCode) => {
      habilitation.vérifierLesHabilitationsEnLecture(
        chantierId,
        territoireCode,
      );
    });

    const result =
      await this.indicateurRepository.recupererDetailsParChantierIdEtTerritoire(
        chantierId,
        territoireCodes,
        jalon,
      );

    // TODO(PVA:JOTA:2025-08-11): Il y a du metier dans le repository à enlever et mettre dans le use case

    return presenterEnDetailsIndicateursContrat(result);
  }
}

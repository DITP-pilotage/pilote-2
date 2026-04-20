import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { presenterEnDetailsIndicateursContrat } from "@/server/chantiers/app/contrats/DetailsIndicateursContrat";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import type { Inject } from "@/server/chantiers/module";

export class RecupererDetailsIndicateursV2UseCase {
  private readonly indicateurRepository: IndicateurRepository;

  private readonly datajobsExecutionQueries: DatajobsExecutionQueries;

  constructor({
    indicateurRepository,
    datajobsExecutionQueries,
  }: Inject<"indicateurRepository" | "datajobsExecutionQueries">) {
    this.indicateurRepository = indicateurRepository;
    this.datajobsExecutionQueries = datajobsExecutionQueries;
  }

  async run(
    chantierId: string,
    territoireCodes: string[],
    habilitations: Habilitations,
    jalon: number,
  ) {
    const datajobsExecution =
      await this.datajobsExecutionQueries.recupererEtatCourant();
    const habilitation = new Habilitation(habilitations);

    territoireCodes.forEach((territoireCode) => {
      habilitation.vérifierLesHabilitationsEnLecture(
        chantierId,
        territoireCode,
      );
    });

    // TODO(PVA:JOTA:2025-08-11): Il y a du metier dans le repository à enlever et mettre dans le use case
    const result =
      await this.indicateurRepository.recupererDetailsParChantierIdEtTerritoire(
        chantierId,
        territoireCodes,
        jalon,
        new Date(datajobsExecution.derniereDateExecution),
      );

    return presenterEnDetailsIndicateursContrat(result);
  }
}

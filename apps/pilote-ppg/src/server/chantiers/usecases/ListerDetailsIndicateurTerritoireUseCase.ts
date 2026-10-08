import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import {
  DetailsIndicateursTerritoireContrat,
  presenterEnDetailsIndicateursTerritoireContrat,
} from "@/server/chantiers/app/contrats/DetailsIndicateursTerritoireContrat";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import type { Inject } from "@/server/chantiers/module";

export class ListerDetailsIndicateurTerritoireUseCase {
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
    listeIndicateurId: string[],
    chantierId: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
  ) {
    const datajobsExecution =
      await this.datajobsExecutionQueries.recupererEtatCourant();
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
            new Date(datajobsExecution.derniereDateExecution),
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

import {
  type ApplicationLogRepository,
  type Granularite,
  type StatistiquesLogs,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";
import type { Inject } from "@/server/application-log/module";
import logger from "@/server/infrastructure/Logger";

export class ObtenirStatistiquesLogsUseCase {
  private readonly applicationLogRepository: ApplicationLogRepository;

  constructor({
    applicationLogRepository,
  }: Inject<"applicationLogRepository">) {
    this.applicationLogRepository = applicationLogRepository;
  }

  async execute(input: {
    dateDebut: Date;
    dateFin: Date;
    granularite: Granularite;
  }): Promise<StatistiquesLogs> {
    // TODO: temporaire - logs fake pour tester la feature, à supprimer
    logger.info(
      { categorie: "api", source: "ObtenirStatistiquesLogsUseCase", granularite: input.granularite },
      "Consultation des statistiques logs",
    );
    logger.error(
      { categorie: "auth", source: "ObtenirStatistiquesLogsUseCase", duree_ms: 12500 },
      "Timeout authentification Keycloak après 12.5s",
    );
    return this.applicationLogRepository.obtenirStatistiques(
      input.dateDebut,
      input.dateFin,
      input.granularite,
    );
  }
}

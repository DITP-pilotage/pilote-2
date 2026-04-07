import {
  type ApplicationLogFiltre,
  type ApplicationLogEntree,
  type ApplicationLogRepository,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";
import type { Inject } from "@/server/application-log/module";
import logger from "@/server/infrastructure/Logger";

export class ListerLogsUseCase {
  private readonly applicationLogRepository: ApplicationLogRepository;

  constructor({
    applicationLogRepository,
  }: Inject<"applicationLogRepository">) {
    this.applicationLogRepository = applicationLogRepository;
  }

  async execute(
    filtres: ApplicationLogFiltre,
  ): Promise<{ logs: ApplicationLogEntree[]; total: number }> {
    // TODO: temporaire - logs fake pour tester la feature, à supprimer
    logger.info(
      { categorie: "api", source: "ListerLogsUseCase", page: filtres.page },
      "Consultation des logs admin",
    );
    logger.error(
      {
        categorie: "import",
        source: "ListerLogsUseCase",
        fichier: "indicateurs_2026.csv",
      },
      "Échec import indicateur : format de date invalide ligne 42",
    );
    return this.applicationLogRepository.lister(filtres);
  }
}

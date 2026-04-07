import {
  type ApplicationLogRepository,
  type Granularite,
  type StatistiquesLogs,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";
import type { Inject } from "@/server/application-log/module";

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
    return this.applicationLogRepository.obtenirStatistiques(
      input.dateDebut,
      input.dateFin,
      input.granularite,
    );
  }
}

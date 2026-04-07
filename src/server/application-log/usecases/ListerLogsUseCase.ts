import {
  type ApplicationLogFiltre,
  type ApplicationLogEntree,
  type ApplicationLogRepository,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";
import type { Inject } from "@/server/application-log/module";

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
    return this.applicationLogRepository.lister(filtres);
  }
}

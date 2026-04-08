import { DateTime } from "luxon";
import type { ApplicationLogRepository } from "@/server/application-log/domain/ApplicationLogRepository";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import type { Inject } from "@/server/application-log/module";

const RETENTION_MINIMUM_JOURS = 7;

export class PurgerLogsUseCase {
  private readonly applicationLogRepository: ApplicationLogRepository;

  constructor({
    applicationLogRepository,
  }: Inject<"applicationLogRepository">) {
    this.applicationLogRepository = applicationLogRepository;
  }

  async execute(input: {
    anterieurA: Date;
  }): Promise<{ nombreSupprime: number }> {
    const dateLimite = DateTime.now()
      .minus({ days: RETENTION_MINIMUM_JOURS })
      .toJSDate();

    if (input.anterieurA > dateLimite) {
      throw new BadRequestError(
        `Impossible de purger des logs de moins de ${RETENTION_MINIMUM_JOURS} jours`,
      );
    }

    const nombreSupprime = await this.applicationLogRepository.purger(
      input.anterieurA,
    );
    return { nombreSupprime };
  }
}

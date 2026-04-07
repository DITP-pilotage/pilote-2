import type { ApplicationLogRepository } from "@/server/application-log/domain/ApplicationLogRepository.interface";
import type { Inject } from "@/server/application-log/module";
import logger from "@/server/infrastructure/Logger";

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
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - RETENTION_MINIMUM_JOURS);

    if (input.anterieurA > dateLimite) {
      throw new Error(
        `Impossible de purger des logs de moins de ${RETENTION_MINIMUM_JOURS} jours`,
      );
    }

    const nombreSupprime = await this.applicationLogRepository.purger(
      input.anterieurA,
    );

    // TODO: temporaire - logs fake pour tester la feature, à supprimer
    logger.warn(
      { categorie: "systeme", source: "PurgerLogsUseCase", nombreSupprime, anterieurA: input.anterieurA.toISOString() },
      "Purge des logs exécutée",
    );

    return { nombreSupprime };
  }
}

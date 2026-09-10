import { prisma } from "@/server/db/prisma";
import { PilotePrismaClient, txStore } from "@/server/db/PrismaTransaction";

const ROLLBACK = Symbol("rollback");

const TIMEOUT_PAR_DEFAUT_MS = 60_000;

export function createIntegrationTest<T extends unknown[]>(
  testFn: (prisma: PilotePrismaClient, ...args: T) => Promise<void>,
  /**
   * `timeout` : durée max de la transaction, en ms. La valeur par défaut couvre
   * un test d'intégration classique. Un scénario qui attend un service externe
   * pendant l'ouverture de la transaction — un tour d'agent Albert, par exemple —
   * la dépasse et doit la relever. Penser à relever aussi le timeout du runner
   * côté appelant, sinon c'est lui qui coupe en premier.
   */
  { timeout = TIMEOUT_PAR_DEFAUT_MS }: { timeout?: number } = {},
) {
  return async (...args: T) => {
    try {
      await prisma.$transaction(
        async (tx) => {
          await txStore.run(tx, async () => {
            await testFn(tx, ...args);
          });
          throw ROLLBACK;
        },
        {
          timeout,
        },
      );
    } catch (error) {
      if (error !== ROLLBACK) {
        throw error;
      }
    }
  };
}

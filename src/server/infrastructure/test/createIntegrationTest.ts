import { prisma } from "@/server/db/prisma";
import { PilotePrismaClient, txStore } from "@/server/db/PrismaTransaction";

const ROLLBACK = Symbol("rollback");

export function createIntegrationTest<T extends unknown[]>(
  testFn: (prisma: PilotePrismaClient, ...args: T) => Promise<void>,
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
          timeout: 60_000,
        },
      );
    } catch (error) {
      if (error !== ROLLBACK) {
        throw error;
      }
    }
  };
}

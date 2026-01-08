import { prisma } from "@/server/db/prisma";
import { PilotePrismaClient, txStore } from "@/server/db/PrismaTransaction";

const ROLLBACK = Symbol("rollback");

export function createIntegrationTest(
  testFn: (prisma: PilotePrismaClient) => Promise<void>,
) {
  return async () => {
    try {
      await prisma.$transaction(
        async (tx) => {
          await txStore.run(tx, async () => {
            await testFn(tx);
          });
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
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

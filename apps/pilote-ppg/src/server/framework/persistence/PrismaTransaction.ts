import { prisma } from "@/server/framework/persistence/prisma";
import { Transaction } from "@/server/framework/persistence/Transaction";
import {
  txStore,
  type PilotePrismaClient,
} from "@/server/framework/persistence/txStore";

export { txStore };
export type { PilotePrismaClient };

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    // Deja dans une transaction : on la rejoint plutot que d'en ouvrir une
    // seconde, que PostgreSQL refuserait d'imbriquer.
    if (txStore.getStore()) return scope();

    return prisma.$transaction((tx) => txStore.run(tx, scope), {
      timeout: 30_000,
      maxWait: 10_000,
    });
  }
}

export const getPrisma = () => txStore.getStore() ?? prisma;

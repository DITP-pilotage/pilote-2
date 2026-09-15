import { prisma } from "@/server/db/prisma";
import { Transaction } from "@/server/db/Transaction";
import { txStore, type PilotePrismaClient } from "@/server/db/txStore";

export { txStore };
export type { PilotePrismaClient };

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    // Deja dans une transaction : on la rejoint plutot que d'en ouvrir une
    // seconde, que PostgreSQL refuserait d'imbriquer.
    if (txStore.getStore()) return scope();

    return prisma.$transaction((tx) => txStore.run(tx, scope), {
      timeout: 30_000,
    });
  }
}

export const getPrisma = () => txStore.getStore() ?? prisma;

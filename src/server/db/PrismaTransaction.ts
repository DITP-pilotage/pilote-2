import { AsyncLocalStorage } from "node:async_hooks";
import { prisma } from "@/server/db/prisma";
import { Transaction } from "@/server/db/Transaction";

export type PilotePrismaClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];
const txStore = new AsyncLocalStorage<PilotePrismaClient>();

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => txStore.run(tx, scope), {
      timeout: 30_000,
    });
  }
}

export const getPrisma = () => txStore.getStore() ?? prisma;

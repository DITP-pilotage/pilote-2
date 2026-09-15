import type { Prisma } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

/** Client Prisma restreint expose a l'interieur d'une transaction interactive. */
export type PilotePrismaClient = Prisma.TransactionClient;

/**
 * Transaction ambiante du contexte d'execution courant.
 *
 * Vit dans son propre module, sans aucune dependance, pour que `prisma.ts` puisse
 * le consulter sans creer de cycle d'import.
 */
export const txStore = new AsyncLocalStorage<PilotePrismaClient>();

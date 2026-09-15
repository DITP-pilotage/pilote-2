import type { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Client Prisma restreint expose a l'interieur d'une transaction interactive :
 * tout le client, moins les methodes qui n'ont pas de sens une fois la
 * transaction ouverte.
 *
 * Volontairement pas `Prisma.TransactionClient`, qui est pourtant l'alias
 * naturel : sous TypeScript 5.9 il resout vers le client complet, sous
 * TypeScript 7 il n'expose plus les delegues de modeles. Le code compile donc
 * aujourd'hui et cassera au passage a TS 7, sur des centaines d'acces du type
 * « Property 'utilisateur' does not exist on type 'TransactionClient' ».
 */
export type PilotePrismaClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Transaction ambiante du contexte d'execution courant.
 *
 * Vit dans son propre module, sans aucune dependance, pour que `prisma.ts` puisse
 * le consulter sans creer de cycle d'import.
 */
export const txStore = new AsyncLocalStorage<PilotePrismaClient>();

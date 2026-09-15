import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { txStore } from "@/server/db/txStore";

/**
 * Joue une suite de requetes de facon atomique.
 *
 * `$transaction([...])` n'existe pas sur un client de transaction : appele depuis
 * une transaction deja ouverte, il retomberait sur le client reel et ses ecritures
 * echapperaient a la transaction englobante. Dans ce cas les requetes sont jouees
 * a la suite, l'atomicite etant deja garantie par la transaction englobante.
 */
export const executerEnLot = async <T>(
  requetes: Prisma.PrismaPromise<T>[],
): Promise<T[]> => {
  if (!txStore.getStore()) return prisma.$transaction(requetes);

  const resultats: T[] = [];
  for (const requete of requetes) resultats.push(await requete);
  return resultats;
};

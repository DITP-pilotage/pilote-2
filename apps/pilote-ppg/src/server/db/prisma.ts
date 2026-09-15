import { PrismaClient } from "@prisma/client";

import { creerAdapter } from "@/server/db/adapter";
import { txStore } from "@/server/db/txStore";

declare global {
  var __db: PrismaClient | undefined;
}

// Pas de `$connect()` ici : Prisma ouvre la connexion a la premiere requete, et
// la declencher a l'import couplait a une base tout module qui importe ce fichier,
// tests unitaires compris.
if (!global.__db) {
  global.__db = new PrismaClient({ adapter: creerAdapter() });
}

const client = global.__db;

/**
 * Client Prisma de l'application, qui rejoint la transaction ambiante s'il y en a une.
 *
 * Sans ce relais, tout code qui importe le client directement ecrit hors de la
 * transaction ouverte par `PrismaTransaction.run` : les ecritures d'un meme cas
 * d'usage se retrouvent a cheval sur deux connexions, et seule une partie est
 * annulee en cas d'erreur. Le passage par `txStore` rattache ces appels a la
 * transaction en cours, et ne change rien quand il n'y en a pas.
 *
 * Effet de bord recherche du cote des tests : `createIntegrationTest` ouvre une
 * transaction annulee a la fin, qui couvre desormais toutes les ecritures, y
 * compris celles des repositories qui n'utilisent pas `PrismaPilote`.
 */
export const prisma = new Proxy(client, {
  get(cible, propriete, recepteur) {
    const transaction = txStore.getStore();
    // `$transaction`, `$connect` et `$disconnect` n'existent pas sur un client de
    // transaction : ces appels doivent continuer a viser le client reel.
    if (transaction && propriete in transaction) {
      const valeur = Reflect.get(transaction, propriete);
      return typeof valeur === "function" ? valeur.bind(transaction) : valeur;
    }
    const valeur = Reflect.get(cible, propriete, recepteur);
    return typeof valeur === "function" ? valeur.bind(cible) : valeur;
  },
});

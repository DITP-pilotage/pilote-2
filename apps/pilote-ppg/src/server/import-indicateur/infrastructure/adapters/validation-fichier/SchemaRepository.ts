import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TableSchemaBrut } from "@/server/infrastructure/table-schema/TableSchema.types";

export const SCHEMAS_AUTORISES = [
  "sans-contraintes.json",
  "restrict-dept.json",
  "restrict-reg.json",
  "restrict-0-100.json",
] as const;

const cache = new Map<string, TableSchemaBrut>();

export function chargerSchemaBrut(nomFichier: string): TableSchemaBrut {
  // `nomFichier` vient de la base (`indic_schema`) : il est validé contre une
  // liste blanche avant toute lecture disque.
  if (!(SCHEMAS_AUTORISES as readonly string[]).includes(nomFichier)) {
    throw new Error(`Schéma d'import inconnu : ${nomFichier}`);
  }

  const enCache = cache.get(nomFichier);
  if (enCache) return enCache;

  const chemin = join(process.cwd(), "public", "schema", nomFichier);
  const schema = JSON.parse(readFileSync(chemin, "utf-8")) as TableSchemaBrut;
  cache.set(nomFichier, schema);
  return schema;
}

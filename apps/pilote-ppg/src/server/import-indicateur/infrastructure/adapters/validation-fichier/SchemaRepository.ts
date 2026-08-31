import fs from "node:fs";
import path from "node:path";
import { TableSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

export function chargerSchema(nomFichier: string): TableSchema {
  const cheminSchema = path.join(process.cwd(), "public", "schema", nomFichier);
  const contenu = fs.readFileSync(cheminSchema, "utf-8");

  return JSON.parse(contenu) as TableSchema;
}

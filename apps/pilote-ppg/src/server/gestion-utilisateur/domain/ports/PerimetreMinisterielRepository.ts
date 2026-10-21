import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";

export interface PerimetreMinisterielRepository {
  list(ids: string[]): Promise<PerimetreMinisteriel[]>;
  listAll(): Promise<PerimetreMinisteriel[]>;
  listAllIds(): Promise<string[]>;
}

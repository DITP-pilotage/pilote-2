import { Territoire } from "@/server/gestion-utilisateur/domain/Territoire";

export interface TerritoireRepository {
  list(codes: string[]): Promise<Territoire[]>;
  listAll(): Promise<Territoire[]>;
  listAllCodes(): Promise<string[]>;
}

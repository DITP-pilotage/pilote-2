import { Ministère } from "@/shared/ministere/Ministere.interface";

export interface MinistèreRepository {
  getListe(): Promise<Ministère[]>;
  getListePourChantiers(chantierIds: string[]): Promise<Ministère[]>;
}

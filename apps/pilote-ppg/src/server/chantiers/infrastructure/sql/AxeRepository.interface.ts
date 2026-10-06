import { Axe } from "@/shared/axe/Axe.interface";

export interface AxeRepository {
  getListe(): Promise<Axe[]>;
  getListePourChantiers(chantierIds: string[]): Promise<Axe[]>;
}

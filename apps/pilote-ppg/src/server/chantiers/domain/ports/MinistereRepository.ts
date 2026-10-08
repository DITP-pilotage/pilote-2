import { Ministère } from "@/shared/ministere/Ministere.interface";

export interface MinistereRepository {
  getListe(): Promise<Ministère[]>;
}

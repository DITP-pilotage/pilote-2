import Ministère from "@/server/domain/ministère/Ministère.interface";

export interface MinistereRepository {
  getListe(): Promise<Ministère[]>;
}

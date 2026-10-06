import { Territoire } from "@/shared/territoire/Territoire.interface";

export interface TerritoireRepository {
  récupérerTous(): Promise<Territoire[]>;
  récupérer(code: Territoire["code"]): Promise<Territoire>;
  récupérerListe(codes: Territoire["code"][]): Promise<Territoire[]>;
}

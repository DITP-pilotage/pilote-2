import { Territoire } from "./Territoire.interface";

export default interface TerritoireRepository {
  récupérerTous(): Promise<Territoire[]>;
  récupérer(code: Territoire["code"]): Promise<Territoire>;
  récupérerListe(codes: Territoire["code"][]): Promise<Territoire[]>;
}

import { Nouveaute } from "@/server/parametrage-nouveautes/domain/Nouveaute";

export interface NouveauteRepository {
  creerNouveaute(nouveaute: Nouveaute): Promise<void>;
  listerNouveautes(): Promise<Nouveaute[]>;
  modifier(nouveaute: Nouveaute): Promise<void>;
}
